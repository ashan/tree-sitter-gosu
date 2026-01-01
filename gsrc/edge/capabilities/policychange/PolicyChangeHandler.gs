package edge.capabilities.policychange

uses edge.capabilities.policychange.dto.TransactionDTO
uses edge.jsonrpc.IRpcHandler
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.security.authorization.Authorizer
uses edge.di.annotations.InjectableNode
uses edge.capabilities.policychange.dto.PolicyChangeDTO
uses edge.capabilities.policychange.draft.IPolicyChangeDraftPlugin
uses edge.jsonrpc.annotation.JsonRpcMethod
uses java.util.Date
uses edge.jsonrpc.exception.JsonRpcInvalidRequestException
uses edge.capabilities.policychange.quote.IPolicyChangeQuotePlugin
uses edge.capabilities.policychange.exception.PolicyChangeUnderwritingException
uses gw.api.util.DateUtil
uses edge.capabilities.helpers.AccountUtil
uses edge.capabilities.policychange.util.PolicyChangeUtil
uses edge.capabilities.policychange.dto.PolicySummaryDTO
uses edge.capabilities.policychange.bind.IPolicyChangeBindPlugin
uses edge.capabilities.quote.lob.dto.QuoteLobDataDTO
uses gw.job.JobProcess
uses gw.web.productmodel.ProductModelSyncIssueWrapper
uses gw.api.web.productmodel.ProductModelSyncIssue
uses gw.job.JobProcessUWIssueEvaluator
uses edge.capabilities.quote.quoting.exception.UnderwritingException
uses edge.util.MapUtil
uses java.util.Arrays
uses edge.capabilities.policychange.dto.PaymentDetailsDTO
uses edge.capabilities.policychange.bind.dto.PolicyChangeBindDTO
uses java.lang.Integer
uses edge.security.EffectiveUserProvider
uses edge.PlatformSupport.Bundle
uses edge.time.LocalDateUtil
uses edge.time.LocalDateDTO

/**
 * Main handler for the policy change capability.
 *
 * This implementation delegates the policy change retrieval (and authorization) to an instance of
 * <code>IPolicyChangeRetrievalPlugin</code>. DTO generation and entity updates are delegated to an instance of
 * <code>IPolicyChangeDraftPlugin</code>.
 */
class PolicyChangeHandler implements IRpcHandler {
  var _policyPeriodAuthorizer: Authorizer<PolicyPeriod> as readonly PolicyPeriodAuthorizer
  var _draftPlugin : IPolicyChangeDraftPlugin
  var _retrievePlugin : IPolicyChangeRetrievalPlugin
  private var _quotingPlugin : IPolicyChangeQuotePlugin
  private var _bindingPlugin : IPolicyChangeBindPlugin
  protected var _userProvider : EffectiveUserProvider

  @InjectableNode
  construct(authorizer:IAuthorizerProviderPlugin, retrievalPlugin:IPolicyChangeRetrievalPlugin,
            draftPlugin:IPolicyChangeDraftPlugin, quotingPlugin:IPolicyChangeQuotePlugin,
            bindingPlugin:IPolicyChangeBindPlugin, aUserProvider: EffectiveUserProvider) {
    _policyPeriodAuthorizer = authorizer.authorizerFor(PolicyPeriod)
    _draftPlugin = draftPlugin
    _retrievePlugin = retrievalPlugin
    _quotingPlugin = quotingPlugin
    _bindingPlugin = bindingPlugin
    _userProvider = aUserProvider
  }


  /**
   * Returns the list of all the policies in the account.
   *
   * @returns a PolicySummaryDTO containing policies for an account
   */
  @JsonRpcMethod
  function getAvailablePolicies() : PolicySummaryDTO[] {
    final var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)
    return account.Policies
        .where(\policy -> policy.Issued)
        .map(\policy -> {

          return populatePolicySummaryDTO(policy)
        })
  }

  /**
   * Returns the  PolicySummaryDTO
   *
   * @returns a PolicySummaryDTO containing the policy
   */
  @JsonRpcMethod
  function getAvailablePolicy(policyNumber: String) : PolicySummaryDTO {
    final var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)
    var policy =  account.Policies.firstWhere( \ policy ->  policy.Issued && (policy.LatestPeriod.PolicyNumber == policyNumber))

    return populatePolicySummaryDTO(policy)
  }


  protected function populatePolicySummaryDTO(policy: Policy) : PolicySummaryDTO {

    var quantity:Integer = null;
    var latestEffectivePeriod = entity.Policy.finder.findPolicyPeriodByPolicyAndAsOfDate(
        policy,
            gw.api.util.DateUtil.endOfDay(Date.Today))
    var canBeStarted = PolicyChangeUtil.checkPolicyChangeCanBeStarted(policy) == null
    var overview:String = null
    var shortOverview:String = null
    var hasPA = latestEffectivePeriod.PersonalAutoLineExists
    var hasHO = latestEffectivePeriod.Lines == null ? false : latestEffectivePeriod.Lines.hasMatch( \ line -> line.Pattern.CodeIdentifier == 'HomeownersLine_HOE')
    var disabled = (!hasPA && !hasHO) || !canBeStarted
    if (hasPA) {
      var vehicleList = latestEffectivePeriod.PersonalAutoLine.Vehicles
          ?.map(\v -> "${v.Make} ${v.Model} ${v.Year.toString()}").toList();
      overview = vehicleList
          .subList(0, vehicleList.size() < 2 ? vehicleList.size() : 2)
          .join(', ')
      quantity = vehicleList.size()
      var vehicle = latestEffectivePeriod.PersonalAutoLine.Vehicles[0]
      shortOverview = "${vehicle.Make} ${vehicle.Model} ${vehicle.Year.toString()}"
    }
    if (hasHO) {
      overview = latestEffectivePeriod.PolicyAddress.AddressLine1
      shortOverview = overview;
    }
    return new PolicySummaryDTO(){
        : EffectiveDate = latestEffectivePeriod.PeriodStart as String,
        : ExpirationDate = latestEffectivePeriod.PeriodEnd as String,
        : Overview = overview,
        : ShortOverview = shortOverview,
        : ProductName = policy.Product.DisplayName,
        : PolicyNumber = latestEffectivePeriod.PolicyNumber,
        : ProductCode = latestEffectivePeriod.Policy.ProductCode,
        : Disabled = disabled,
        : Quantity = quantity
    }

  }

  /**
   * Returns a DTO with the policy change details for the requested policy.
   *
   * DTO generation is delegated to an instance of <code>IPolicyChangeDraftPlugin</code>
   * If the retrieved policy period belongs to an pending policy change transaction, it will call <code>IPolicyChangeDraftPlugin#toDto(entity.PolicyChange)</code>
   * passing the PolicyChange transaction, otherwise it will call <code>IPolicyChangeDraftPlugin#toDto(entity.PolicyPeriod)</code>.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String)</code> - to retrieve the policy change</dd>
   *   <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyPeriod)</code> - to provide the policy change as a DTO</dd>
   * </dl>
   *
   * @param policyNumber the policy number identifying the policy from which the change is to be loaded
   * @returns details for a policy change
   */
  @JsonRpcMethod
  function load(policyNumber:String):TransactionDTO {
    var policyPeriod = _retrievePlugin.retrieveByPolicyNumber(policyNumber)

    var dto : TransactionDTO
    if ( policyPeriod.Job typeis PolicyChange && !policyPeriod.Job.Complete ) {
      dto = _draftPlugin.toDto(policyPeriod.Job)
    } else {
      dto = _draftPlugin.toDto(policyPeriod)
    }

    return dto
  }

  /**
   * Returns a DTO with the policy change details for the requested policy.
   *
   * DTO generation is delegated to an instance of <code>IPolicyChangeDraftPlugin</code>
   * If the retrieved policy period belongs to an pending policy change transaction, it will call <code>IPolicyChangeDraftPlugin#toDto(entity.PolicyChange)</code>
   * passing the PolicyChange transaction, otherwise it will call <code>IPolicyChangeDraftPlugin#toDto(entity.PolicyPeriod)</code>.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String)</code> - to retrieve the policy change</dd>
   *   <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyPeriod)</code> - to provide the policy change as a DTO</dd>
   * </dl>
   *
   * @param jobNumber the job number identifying the policy from which the change is to be loaded
   * @returns details for a policy change
   */
  @JsonRpcMethod
  function loadByJobNumber(jobNumber:String):TransactionDTO {
    var policyPeriod = _retrievePlugin.retrieveByJobNumber(jobNumber)

    var dto : TransactionDTO
    if ( policyPeriod.Job typeis PolicyChange && !policyPeriod.Job.Complete ) {
      dto = _draftPlugin.toDto(policyPeriod.Job)
    } else {
      dto = _draftPlugin.toDto(policyPeriod)
    }

    return dto
  }

  /**
   * Updates or creates a policy change to match a policy change DTO.
   *
   * If the policy period returned by the retrieval plugin is not associated to a pending policy change transaction,
   * this implementation creates a new policy change transaction. Otherwise it updates the policy period for
   * the change transaction.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String)</code> - to retrieve the policy change</dd>
   *   <dd><code>IPolicyChangeDraftPlugin#updateFromDto(PolicyChange, PolicyChangeDTO)</code> - to update the policy change from the DTO</dd>
   *   <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyPeriod)</code> - to provide the policy change as a DTO</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid</dd>
   * </dl>
   *
   * @param changeDto details for the policy change that is to be saved
   * @returns details for the saved policy change
   */
  @JsonRpcMethod
  function save(changeDto:TransactionDTO) : TransactionDTO {
    var policyPeriod = _retrievePlugin.retrieveByPolicyNumber(changeDto.PolicyNumber)
    var change : PolicyChange
    if ( policyPeriod.Job typeis PolicyChange and !policyPeriod.Job.Complete ) {
      change = policyPeriod.Job
    }
    if ( change.JobNumber != changeDto.JobID ) {
      throw new JsonRpcInvalidRequestException() {:Message = "Invalid job number"}
    }

    checkEffectiveDate(policyPeriod, changeDto)
    var effectiveDateMidnight = LocalDateUtil.toMidnightDate(changeDto.EffectiveDate)
    Bundle.transaction(\ bundle -> {
      if ( change != null ) {
        change = bundle.add(change)
        policyPeriod = change.LatestPeriod

        // Set the policy period in Draft mode it it is quoted
        if ( policyPeriod.Status == PolicyPeriodStatus.TC_QUOTED ) {
          policyPeriod.PolicyChangeProcess.edit()
        }

        if ( DateUtil.compareIgnoreTime(effectiveDateMidnight, policyPeriod.EditEffectiveDate)  != 0 ) {
          // Checks before changing the effective date as this is an expensive operation
          policyPeriod.PolicyChangeProcess.changeEditEffectiveDate(effectiveDateMidnight)
        }
      } else {
        change = new PolicyChange()
        change.startJob(policyPeriod.Policy, effectiveDateMidnight)
        policyPeriod = change.LatestPeriod
      }
      _draftPlugin.updateFromDto(change, changeDto)
    })

    return _draftPlugin.toDto(change)
  }

  /**
   * Updates the coverages for a policy change
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   *   <dd><code>IPolicyChangeDraftPlugin#updateCoveragesFromDto(PolicyPeriod, QuoteLobDataDTO)</code> - to update the coverages</dd>
   *   <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   * </dl>
   *
   * @param jobNumber a job number identifying the policy change for which coverages are to be updated
   * @param coverages details of the current policy change
   * @returns policy change details with updated coverages
   */
  @JsonRpcMethod
  function updateCoverages(jobNumber:String,coverages:QuoteLobDataDTO) : TransactionDTO {
    var period = _retrievePlugin.retrieveByJobNumber(jobNumber)
    Bundle.transaction(\bundle -> {
      period = bundle.add(period)

      // Set the policy period in Draft mode it it is quoted
      if ( period.Status == PolicyPeriodStatus.TC_QUOTED ) {
        period.PolicyChangeProcess.edit()
      }

      _draftPlugin.updateCoveragesFromDto(period, coverages)
      syncSubmissionWithProductModelAndFixIssues(period)
      //throw underwriting exception if there are any blocking UW issues
      checkForBlockingUWIssues(period, UWIssueBlockingPoint.TC_BLOCKSQUOTE)
    })

    return _draftPlugin.toDto(period.Job as PolicyChange)
  }

  /**
   * Quotes a policy change
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   *   <dd><code>IPolicyChangeQuotePlugin#quote(PolicyChange)</code> - to quote the policy change</dd>
   *   <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid or the effective date is in the past</dd>
   *   <dd><code>UnderwritingException</code> - if there was an underwriting issue preventing the quote</dd>
   * </dl>
   *
   * @param jobNumber a job number identifying the policy change that is to be quoted
   * @returns details of the quoted policy change
   */
  @JsonRpcMethod
  function quote(jobNumber:String) : TransactionDTO {
    var policyPeriod = _retrievePlugin.retrieveByJobNumber(jobNumber)
    var policyChange : PolicyChange
    if ( policyPeriod.Job typeis PolicyChange and !policyPeriod.Job.Complete ) {
      policyChange = policyPeriod.Job
    }
    if ( policyChange == null ) {
      throw new JsonRpcInvalidRequestException() {:Message = "Invalid job number"}
    }
    if ( PolicyChangeUtil.computeMinimumStartDate(policyChange.Policy).trimToMidnight() > policyChange.LatestPeriod.EditEffectiveDate) {
      throw new JsonRpcInvalidRequestException() {:Message = "Cannot quote a policy change with edit effective date in the past"}
    }

    Bundle.transaction(\ bundle -> {
      policyChange = bundle.add(policyChange)
      policyPeriod = bundle.add(policyPeriod)
      checkForBlockingUWIssues(policyPeriod, UWIssueBlockingPoint.TC_BLOCKSBIND)
      _quotingPlugin.quote(policyChange)
    })

    return _draftPlugin.toDto(policyChange)
  }

  /**
   * Binds a policy change
   * If there is any transaction cost associated to this policy change, process the payment for the policy change. If the payment is successful then the policy change is bound.
   * If the policy has a pending draft renewal job, this operation will also try to apply the change to the renewal.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   *   <dd><code>IPolicyChangeBindPlugin#bind(PolicyChange, PaymentDetailsDTO)</code> - to bind the policy change</dd>
   *   <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid</dd>
   *   <dd><code>PolicyChangeUnderwritingException</code> - if there was an underwriting issue preventing the bind</dd>
   * </dl>
   *
   * @param jobNumber a job number identifying the policy change that is to be bound
   * @param paymentDetails details for how the bound change should be made
   * @returns details of the bound policy change
   */
  @JsonRpcMethod
  function bind(jobNumber:String, paymentDetails:PaymentDetailsDTO) : PolicyChangeBindDTO {
    var policyPeriod = _retrievePlugin.retrieveByJobNumber(jobNumber)
    var policyChange : PolicyChange
    var changesAppliedForward = false
    if ( policyPeriod.Job typeis PolicyChange and !policyPeriod.Job.Complete ) {
      policyChange = policyPeriod.Job
    }
    if ( policyChange == null ) {
      throw new JsonRpcInvalidRequestException() {:Message = "Invalid job number"}
    }

    var uwExceptionEncounteredFlag = false
    Bundle.transaction(\ bundle -> {
      policyChange = bundle.add(policyChange)
      try {
        changesAppliedForward = _bindingPlugin.bind(policyChange, paymentDetails)

      } catch (uwe : PolicyChangeUnderwritingException) {
        // Set flag for use later
        uwExceptionEncounteredFlag = true
      }
    })

    if (uwExceptionEncounteredFlag) {
      // Send generic underwriting message back to the client
      throw new PolicyChangeUnderwritingException()
    }

    return new PolicyChangeBindDTO(){
        :Transaction = (_draftPlugin.toDto(policyChange) as PolicyChangeDTO),
        :ChangesAppliedForward = changesAppliedForward
    }
  }

  /**
   * Withdraws a policy change
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   *   <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid</dd>
   *   <dd><code>PolicyChangeUnderwritingException</code> - if there was an underwriting issue preventing the withdraw</dd>
   * </dl>
   *
   * @param jobNumber a job number identifying the policy change that is to be withdrawn
   * @returns details of the withdrawn policy change
   */
  @JsonRpcMethod
  function withdraw(jobNumber:String) : TransactionDTO {
    var policyPeriod = _retrievePlugin.retrieveByJobNumber(jobNumber)
    var policyChange : PolicyChange
    if ( policyPeriod.Job typeis PolicyChange and !policyPeriod.Job.Complete ) {
      policyChange = policyPeriod.Job
    }
    if ( policyChange == null ) {
      throw new JsonRpcInvalidRequestException() {:Message = "Invalid job number"}
    }

    var uwExceptionEncounteredFlag = false
    Bundle.transaction(\ bundle -> {
      policyChange = bundle.add(policyChange)
      try {
        if (policyChange.SelectedVersion.PolicyChangeProcess.canWithdraw().Okay) {
          policyChange.SelectedVersion.PolicyChangeProcess.withdrawJob()
        }
      } catch (uwe : PolicyChangeUnderwritingException) {
        // Set flag for use later
        uwExceptionEncounteredFlag = true
      }
    })

    if (uwExceptionEncounteredFlag) {
      // Send generic underwriting message back to the client
      throw new PolicyChangeUnderwritingException()
    }

    return _draftPlugin.toDto(policyChange)
  }

  /**
   * Checks if a date would be valid as an effective date for a given policy
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String)</code> - to retrieve the policy change</dd>
   * </dl>
   *
   * @param policyNumber a policy number identifying the policy against which the date should be checked
   * @param checkDate a date that will be validated as a possible effective date for the given policy
   * @returns true if the date can be used as an effective date for the given policy, false otherwise
   */
  @JsonRpcMethod
  function checkEffectiveDateIsValid(policyNumber:String, checkDate: LocalDateDTO) : Boolean {

    var policyPeriod = _retrievePlugin.retrieveByPolicyNumber(policyNumber)
    var lowerBound = PolicyChangeUtil.computeMinimumStartDate(policyPeriod.Policy).trimToMidnight()
    var upperBound = policyPeriod.PeriodEnd.trimToMidnight()
    var datetoCompare = LocalDateUtil.toMidnightDate(checkDate)

    if ( datetoCompare < lowerBound || datetoCompare > upperBound ) {
      return false
    } else {
      return true
    }
  }

  /**
   * Helper function to check if the effective date for a policy change being saved is valid.
   */
  private function checkEffectiveDate(period: PolicyPeriod, changeDto: TransactionDTO) {
    var checkDate = LocalDateUtil.toMidnightDate(changeDto.EffectiveDate)
    var lowerBound = PolicyChangeUtil.computeMinimumStartDate(period.Policy).trimToMidnight()
    var upperBound = period .PeriodEnd.trimToMidnight()

    if ( checkDate < lowerBound || checkDate > upperBound ) {
      throw new JsonRpcInvalidRequestException() { : Message = "Effective Date (${checkDate}) must be between ${lowerBound} and ${upperBound}"}
    }
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
        if (term.Pattern.Required && !term.DisplayValue.HasContent){
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

  /**
   * Checks for presence of underwriting rules on the submission.
   */
  protected function checkForBlockingUWIssues(period : PolicyPeriod, checkingPoint : UWIssueBlockingPoint) {
    try {
      final var _evaluator = new JobProcessUWIssueEvaluator()
      _evaluator.evaluateAndCheckForBlockingUWIssues(period, checkingPoint)
    } catch (e : java.lang.Exception) {
      final var uwIssues = period.UWIssuesActiveOnly
      if (uwIssues != null && uwIssues.Count > 0) {
        throw new UnderwritingException(e){
        :Message = e.toString(),
        :Data =
            MapUtil.groupCollection(
                Arrays.asList(uwIssues), \i ->i.IssueType.Code, \ i -> i.LongDescription)
                .mapValues(\ v -> v.join(";"))
      }
      }
    }
  }

}
