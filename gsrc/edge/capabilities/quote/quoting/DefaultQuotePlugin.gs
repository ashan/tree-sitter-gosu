package edge.capabilities.quote.quoting
uses edge.capabilities.quote.quoting.exception.EntityValidationException
uses edge.di.annotations.ForAllGwNodes
uses gw.api.util.Logger
uses gw.job.JobProcess
uses gw.job.JobProcessUWIssueEvaluator
uses edge.util.MapUtil
uses java.util.Arrays
uses edge.capabilities.quote.quoting.dto.QuotingDTO
uses edge.capabilities.quote.quoting.dto.QuoteDTO
uses edge.capabilities.quote.lob.ILobQuotingPlugin
uses edge.capabilities.quote.quoting.util.QuoteUtil
uses edge.capabilities.quote.quoting.exception.UnderwritingException
uses gw.api.web.productmodel.ProductModelSyncIssue
uses gw.job.sxs.SideBySideProcess
uses gw.util.Pair
uses gw.web.productmodel.ProductModelSyncIssueWrapper
uses edge.capabilities.quote.lob.dto.QuoteLobDataDTO
uses java.lang.Exception
uses java.util.Set
uses edge.capabilities.quote.quoting.exception.BlockQuoteUnderwritingException

/**
 * Default implementation of quoting plugin.
 */
class DefaultQuotePlugin implements IQuotePlugin {
  
  private static final var LOGGER = Logger.forCategory(DefaultQuotePlugin.Type.QName)
  
  private var _lobPlugin : ILobQuotingPlugin <QuoteLobDataDTO>
  private var _validationLevelPlugin : IQuoteValidationLevelPlugin

  @ForAllGwNodes
  @Param("lobPlugin", "Line-of-business extension plugin")
  @Param("validationLevelPlugin", "Validation level plugin")
  construct(lobPlugin : ILobQuotingPlugin <QuoteLobDataDTO>, validationLevelPlugin : IQuoteValidationLevelPlugin) {
    this._lobPlugin = lobPlugin
    this._validationLevelPlugin = validationLevelPlugin
  }


  override function quoteAllOfferings(sub : Submission, checkForBlockIssueUWIssues : Boolean) {
    createInitialOfferings(sub)
    editPeriod(sub.SelectedVersion)
    doQuote(sub, checkForBlockIssueUWIssues)
  }

  override function quoteBaseOffering(sub : Submission, checkForBlockIssueUWIssues : Boolean) {
    doQuote(sub, checkForBlockIssueUWIssues)
  }

  override function updateCustomQuote(period: PolicyPeriod, data: QuoteDTO) {
    editPeriod(period)
    _lobPlugin.updateCustomQuote(period, data.Lobs)
    syncSubmissionWithProductModelAndFixIssues(period)
    quoteSinglePeriod(period)
  }


  override function syncCustomQuoteCoverages(period : PolicyPeriod, data : QuoteDTO) {
    editPeriod(period)
    _lobPlugin.updateCustomQuote(period, data.Lobs)
    syncSubmissionWithProductModelAndFixIssues(period)
    //throw an exception if there are any blocking UW issues caused by selection
    checkForBlockingUWIssues(period, UWIssueBlockingPoint.TC_BLOCKSISSUANCE)
  }
  

  
  override public function toDTO(submission : Submission, checkForBlockIssueUWIssues : Boolean) : QuotingDTO {
    if (submission.ResultingBoundPeriod != null) {
      return fromPeriods({submission.ResultingBoundPeriod}, checkForBlockIssueUWIssues)
    }
    if (submission.SelectedVersion.Status != PolicyPeriodStatus.TC_QUOTED  &&
        submission.SelectedVersion.Status != PolicyPeriodStatus.TC_QUOTING) {
      return null
    }

    return fromPeriods(submission.ActivePeriods, checkForBlockIssueUWIssues)
  }

  override function toQuoteDTO(period : PolicyPeriod, checkForBlockIssueUWIssues : Boolean) : QuoteDTO {
    final var res = new QuoteDTO()
    QuoteUtil.fillBaseProperties(res, period)
    res.IsCustom = period == QuoteUtil.getCustomPeriod(period.Submission)
    res.Lobs = _lobPlugin.getQuoteDetails(period)

    if(checkForBlockIssueUWIssues) {
      var blockingUWIssue = period.UWIssuesActiveOnly.firstWhere( \ uwIssue -> {
        return (uwIssue.isBlockingUser(typekey.UWIssueBlockingPoint.TC_BLOCKSISSUANCE, User.util.CurrentUser.UWAuthorityProfiles) && (uwIssue.Approval == null || uwIssue.Rejected))
      })
      res.HasBlockingUWIssues = (blockingUWIssue != null)
    }

    return res
  }

  private function fromPeriods(periods : PolicyPeriod[], checkForBlockIssueUWIssues : Boolean) : QuotingDTO {
    periods.sort(\ p1, p2 -> isPreferred(p1, p2))
    final var res = new QuotingDTO()

    res.OfferedQuotes = periods
           .where( \ p -> p.Status == PolicyPeriodStatus.TC_QUOTED || p.Status == PolicyPeriodStatus.TC_BOUND || p.BranchName == "CUSTOM")
           .map(\p -> toQuoteDTO(p, checkForBlockIssueUWIssues))

    return res
  }

  protected function isPreferred(p1 : PolicyPeriod, p2 : PolicyPeriod) : boolean {
    if (p1.Offering == null && p2.Offering != null) {
      return false
    }
    
    if (p1.Offering != null && p2.Offering == null) {
      return true
    }
    
    return p1.TotalCostRPT < p2.TotalCostRPT
  }


  /**
   * Performs an actual quoting process after all offerings was
   * created or updates.
   */
  protected function doQuote(sub : Submission, checkForBlockIssueUWIssues : Boolean) {
    fixUnderwritingIssues(sub)

    if(checkPeriodsCanQuote(sub)){
      if (!approveBlockQuoteUWIssues(sub)) {
        // Need to generate the Issues as a separate transaction to persist data
        // Committing current bundle here prevents inactive periods from being withdrawn
        gw.transaction.Transaction.runWithNewBundle(\ bundle -> {
          checkPeriodsCanQuote(bundle.add(sub))
        })
        throw new BlockQuoteUnderwritingException(){
            :Message = "Unable to quote one or more period(s)"
        }
      }
    }

    var activePeriods = sub.ActivePeriods?.toSet()
    quotePeriods(activePeriods)

    if (checkForBlockIssueUWIssues) {
      var blockingUWIssueOnAnyQuote = false;
      //SideBySide quoting ends ups using TC_BLOCKSQUOTERELEASE in QuoteProcess evaluatePreQuoteReleaseUWIssues
      //called by handleQuoteResponse, but we need to use TC_BLOCKSISSUANCE as we need the UWIssues to be returned
      //which SideBySideProcess.getQuotes do not
      //Use portal way to manually check for TC_BLOCKSISSUANCE in seperate bundle
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        //var s = bundle.add(submission)
        for (period in activePeriods) {
          blockingUWIssueOnAnyQuote = checkForBlockingUWIssues(bundle.add(period), UWIssueBlockingPoint.TC_BLOCKSISSUANCE)
        }
      })
      if(blockingUWIssueOnAnyQuote){
        throw new UnderwritingException() {
          :Message = "Blocking UWIssues exist on one or more period(s)"
        }
      }
    }
  }

  protected function checkPeriodsCanQuote(aSubmission : Submission) : boolean {
    var nonQuotablePeriod : List<PolicyPeriod>
    nonQuotablePeriod = aSubmission.ActivePeriods.where( \ aPeriod -> checkForBlockingUWIssues(aPeriod, typekey.UWIssueBlockingPoint.TC_BLOCKSQUOTE)).toList()

    return nonQuotablePeriod != null && nonQuotablePeriod.HasElements
  }
  
  
  /**
   * Checks for presence of underwriting rules on the submission.
   */
  protected function checkForBlockingUWIssues(period : PolicyPeriod, checkingPoint : UWIssueBlockingPoint) : boolean {
    try {
       final var _evaluator = new JobProcessUWIssueEvaluator()
       _evaluator.evaluateAndCheckForBlockingUWIssues(period, checkingPoint)
      return false
    } catch (e : java.lang.Exception) {
      LOGGER.info("evaluateAndCheckForBlockingUWIssues ran with exceptions: "+e)
      final var uwIssues = period.UWIssuesActiveOnly.where( \ uwIssue -> uwIssue.isBlockingUser(checkingPoint, User.util.CurrentUser.UWAuthorityProfiles))
      LOGGER.info("Number of issues blocking ${checkingPoint.Code}: ${uwIssues.length}")
      return uwIssues != null && uwIssues.Count > 0
    }
  }


  /**
   * Get a quote for each period/offering on the submission.
   */
  protected function quotePeriods(activePeriods : Set<PolicyPeriod>) {

    var issues = SideBySideProcess.getQuotes(activePeriods)
    checkSideBySideProcessExceptions(issues.where(\i -> i.Second != null))
  }


  private function checkSideBySideProcessExceptions(issues : List<Pair<PolicyPeriod,Exception>>) {
    var exceptionMsg = "Failed to Quote the following period(s)" + "\n"
    var initSize = exceptionMsg.size
    issues.sort(\i1,i2 -> i1.First.BranchNumber < i2.First.BranchNumber)
        .each(\i -> {
          exceptionMsg += i.First.BranchName + ": " + i.Second.LocalizedMessage + "\n"
        })
    if (exceptionMsg.size > initSize) {
      throw new EntityValidationException(){
          :Message = "EntityValidationException",
          :Data = exceptionMsg
          }
    }
  }
  
  
  
  /**
   *  Quote just the given PolicyPeriod. Our submission is a multi-draft submission so there is more than PolicyPeriod on the submission
   */
  protected function quoteSinglePeriod(period : PolicyPeriod) {
    var proc = period.SubmissionProcess
    period.AllCoverables.each( \ elt -> elt.syncCoverages())
    var cond = proc.canRequestQuote()
    if (cond.Okay){
      if(!checkForBlockingUWIssues(period, typekey.UWIssueBlockingPoint.TC_BLOCKSQUOTE)) {
        try {
          proc.requestQuote(_validationLevelPlugin.getValidationLevel(), RatingStyle.TC_DEFAULT)

        } catch (e : Exception) {
          LOGGER.error("Exception occured while quoting period", e)
          throw new UnderwritingException(e)
        }
      } else {
        LOGGER.error("UW Issue blocking quote")
        throw new BlockQuoteUnderwritingException()
      }
    } else {    
      LOGGER.error("Could not quote for the following reasons : " + cond.Message)
      throw new Exception()
    }
  }

  
  
  /**
   * Updates issues in the quote.
   */
  protected function updateUnderwritingIssues(submission : Submission) {
    submission.ActivePeriods.each(\ p -> JobProcess.checkBranchAgainstProductModel(p))
  }
  
  
  /**
   * Clear any underwriting issues
   */ 
  protected function fixUnderwritingIssues(submission : Submission) {
    submission.ActivePeriods.each(\ p -> {
      final var issues = JobProcess.checkBranchAgainstProductModel(p)
      issues.where(\i -> !i.Issue.Fixed).each(\i -> { i.Issue.fixIssue(p) })
    })  
  }
  

  
  /**
   * Sometimes, after fixing product model issues, required variables are left blank. If this is the case quoting will fail.
   * Here, we resync the model after changing a coverage, fix any issues this causes and then select a value for required terms that have been erased.
   * See POR-1465 for original issue.
   */
  private function syncSubmissionWithProductModelAndFixIssues(customPeriod : PolicyPeriod) {
    var issues = JobProcess.checkBranchAgainstProductModel(customPeriod)
    for (i in issues) {
      if (!i.Issue.Fixed && i.Issue typeis ProductModelSyncIssue) {
        var wrapped = ProductModelSyncIssueWrapper.wrapIssue(i.Issue)
        if ( wrapped.Severity == ERROR ) {
          i.Issue.fixIssue(customPeriod)
        }
      }
    }

    // Sets a sensible value for coverage terms cleared by the previous sync
    for (cov in customPeriod.AllCoverables*.CoveragesFromCoverable){
      for (term in cov.CovTerms){
        if (term.Pattern.Required && term.DisplayValue === null){
          if (term typeis gw.api.domain.covterm.OptionCovTerm) {
            term.setOptionValue(term.Pattern.Options.first())
          } else if (term typeis gw.api.domain.covterm.PackageCovTerm ) {
            term.setPackageValue(term.Pattern.getOrderedAvailableValues(term).first())
          } else if (term typeis gw.api.domain.covterm.TypekeyCovTerm) {
            term.Value = term.Pattern.TypeList.getTypeKeys(false).first()
          } else if (term typeis gw.api.domain.covterm.BooleanCovTerm) {
            term.setValue(false)
          }
        }
      }
    }
  }

  /** Creates initial offerings for the submission.
   * This method is called by default Quote implementation for 
   * submissions where "custom quote" is not defined yet.
   */
  protected function createInitialOfferings(sub : Submission) {
    final var base = QuoteUtil.getBasePeriod(sub)

    _lobPlugin.generateVariants(base)

    editPeriod(base)    
  }
  
  /**
   * Starts editing one period.
   */
  protected function editPeriod(period : PolicyPeriod) {
    if (period.Status == PolicyPeriodStatus.TC_QUOTING || 
        period.Status == PolicyPeriodStatus.TC_QUOTED ||
        period.Status == PolicyPeriodStatus.TC_NEW) {
      period.SubmissionProcess.edit()
    }
  }
  
  
  
  /**
   * Checks if required period have a custom quote.
   */
  protected function hasCustomQuote(sub : Submission) : boolean {
    return sub.ActivePeriods.length >= 2
  }

  protected function approveBlockQuoteUWIssues(aSubmission : Submission) : boolean {
    var baseOffering = aSubmission.SelectedVersion

    aSubmission.ActivePeriods.each( \ period -> {
      if (period != baseOffering) {
        period.UWIssuesActiveOnly.each( \ uwIssue -> {
          if (baseOffering.UWIssuesActiveOnly.hasMatch( \ baseUWIssue -> baseUWIssue.ShortDescription == uwIssue.ShortDescription
                                                                          && baseUWIssue.IssueKey == uwIssue.IssueKey
                                                                          && baseUWIssue.HasApprovalOrRejection
                                                                          && !baseUWIssue.Rejected)) {
            uwIssue.createAutomaticApproval("Portal automatic approval")
          }
        })
    }
    })

    return !checkUnapprovedBlockingIssuesExist(aSubmission, typekey.UWIssueBlockingPoint.TC_BLOCKSQUOTE)
  }

  protected function checkUnapprovedBlockingIssuesExist(aSubmission : Submission, checkingPoint : UWIssueBlockingPoint) : boolean{
    return aSubmission.ActivePeriods*.UWIssuesActiveOnly.where( \ uwIssue -> {
      return uwIssue.isBlockingUser(checkingPoint, User.util.CurrentUser.UWAuthorityProfiles)
              && (!uwIssue.HasApprovalOrRejection || uwIssue.Rejected)
    }).HasElements
  }
}
