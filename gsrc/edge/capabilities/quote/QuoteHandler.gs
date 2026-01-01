package edge.capabilities.quote
uses edge.capabilities.quote.quoting.exception.EntityValidationException
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.IRpcHandler
uses edge.capabilities.quote.session.ISessionPlugin
uses edge.capabilities.quote.draft.IDraftSubmissionPlugin
uses edge.PlatformSupport.Bundle
uses gw.api.database.Query
uses edge.exception.EntityNotFoundException
uses edge.capabilities.quote.binding.IBindingPlugin
uses edge.capabilities.quote.mailing.IQuoteMailingPlugin
uses edge.capabilities.quote.mailing.dto.QuoteEmailDTO
uses edge.capabilities.quote.quoting.util.QuoteUtil
uses edge.capabilities.quote.quoting.IQuotePlugin
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.capabilities.quote.dto.QuoteDataDTO
uses edge.capabilities.quote.dto.QuoteRetrievalDTO
uses edge.webapimodel.dto.PCWebApiModelDTO
uses edge.capabilities.quote.questionset.util.QuestionSetUtil
uses edge.capabilities.quote.lob.ILobMetadataPlugin
uses java.lang.Exception
uses edge.capabilities.quote.quoting.exception.UnderwritingException
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.security.authorization.Authorizer
uses edge.el.Expr
uses edge.aspects.validation.annotations.Context
uses edge.PlatformSupport.Bundle
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection

/**
 * Quoting handler. Manages quoting session.
 */
class QuoteHandler implements IRpcHandler  {

  private static final var LOGGER = new Logger(Reflection.getRelativeName(QuoteHandler))

  /**
   * Draft submission plugin used in quote.
   */
  private var _draftPlugin : IDraftSubmissionPlugin

  /**
   * Session management plugin.
   */
  private var _sessionPlugin :  ISessionPlugin


  /**
   * Quoting plugin.
   */
  private var _quotingPlugin : IQuotePlugin


  /**
   * Submission binding plugin.
   */
  protected var _bindingPlugin : IBindingPlugin


  /**
   * Quote mailing plugin.
   */
  private var _quoteMailingPlugin : IQuoteMailingPlugin


  /**
   * Metadata generation extension plugin.
   */
  private var _lobMetadataPlugin: ILobMetadataPlugin

  /**
  *  Authorizer
  */
  private var _submissionAuthorizer: Authorizer<Submission> as readonly SubmissionAuthorizer

  @InjectableNode
  @Param("draftPlugin", "Plugin used to manage base quote information")
  @Param("sessionPlugin", "Session management plugin")
  @Param("productAvailabilityPlugin", "Plugin to determine product availability for this capability")
  @Param("quotingPlugin", "Quoting process plugin implementation")
  @Param("bindingPlugin", "Binding process plugin")
  @Param("quoteMailingPlugin", "Plugin used to mail the quote")
  @Param("lobMetadataPlugin", "Plugin used to extend metadata generation")
  @Param("authorizer", "Authorizer added to check user can retrieve submission")
  construct(
        draftPlugin : IDraftSubmissionPlugin,
        sessionPlugin : ISessionPlugin,
        quotingPlugin : IQuotePlugin,
        bindingPlugin : IBindingPlugin,
        quoteMailingPlugin : IQuoteMailingPlugin,
        lobMetadataPlugin : ILobMetadataPlugin,
        authorizer:IAuthorizerProviderPlugin) {
    this._draftPlugin = draftPlugin
    this._sessionPlugin = sessionPlugin
    this._quotingPlugin = quotingPlugin
    this._bindingPlugin = bindingPlugin
    this._quoteMailingPlugin = quoteMailingPlugin
    this._lobMetadataPlugin = lobMetadataPlugin
    this._submissionAuthorizer = authorizer.authorizerFor(Submission)
  }

  @JsonRpcUnauthenticatedMethod
  function getMetaData() : Object {
    return PCWebApiModelDTO.forTypes(
        {QuoteDataDTO,QuoteEmailDTO, QuoteRetrievalDTO},
        _lobMetadataPlugin.getQuestionSetCodes().map(\qs -> QuestionSetUtil.getByCode(qs))
    )
  }


  /**
   * Creates new submission job and generates a session to be used during the submission process.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IDraftSubmissionPlugin#createSubmission(Bundle,EnEntityCreationContext,String,DraftDataDTO)</code> - to create a new submission
   *   passing the draft data in <code>qdd.DraftData</code></dd>
   *   <dd><code>IDraftSubmissionPlugin#toDTO(Submission)</code> - to try update the custom quote</dd>
   *   <dd><code>ISessionPlugin#getSession(String)</code> - to create the session id which will be added to the
   *       returned dto</dd>
   * </dl>
   *
   * @param  qdd initial data to create the submission. This implementation only uses the information in <code>qdd.DraftData</code>
   * @return     the DTO for the newly created submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID returned by the session plugin</dd>
   *               <dt>QuoteID</dt><dd>the JobNumber of the newly created submission</dd>
   *               <dt>DraftData</dt><dd>the draft data DTO</dd>
   *               <dt>QuotingData</dt><dd><code>null</code></dd>
   *               <dt>BindingData</dt><dd><code>null</code></dd>
   *               <dt>IsSubmitAgent</dt><dd><code>null</code></dd>
   *             </dl>
   */
  @JsonRpcUnauthenticatedMethod
  public function create(qdd : QuoteDataDTO) : QuoteDataDTO {
    final var draft = Bundle.resolveInTransaction(\ b ->
      _draftPlugin.createSubmission(qdd.DraftData.ProductCode, qdd.DraftData)
    )
    final var sessId = _sessionPlugin.getSession(draft.JobNumber)
    return toDTO(sessId, draft)
  }


  /**
   * Updates an existing submission and saves the changes.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>ISessionPlugin#validateAndRefreshSession(String,String)</code> - to pull the session id out of
   *       QuoteDataDTO where it validates whether the session is valid or not</dd>
   *   <dd><code>IDraftSubmissionPlugin#updateSubmission(Submission,DraftDataDTO)</code> - to update the submission with the DraftDataDTO</dd>
   *   <dd><code>IQuotePlugin#toDTO(Submission)</code> - to re-generate the returned quote data from the submission</dd>
   *   <dd><code>IBindingPlugin#getBindingData(Submission)</code> - to re-generate the binding data from the submission</dd>
   * </dl>
   *
   * @return     the DTO for the updated submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID</dd>
   *                <dt>QuoteID</dt><dd>the JobNumber of the submission</dd>
   *                <dt>DraftData</dt><dd>the draft data DTO</dd>
   *                <dt>QuotingData</dt><dd>the quote data</dd>
   *                <dt>BindingData</dt><dd>the quote data</dd>
   *                <dt>IsSubmitAgent</dt><dd><code>null</code></dd>
   *             </dl>
   */
  @JsonRpcUnauthenticatedMethod
  @Context("AccountDOBRequired", Expr.const(true))
  public function save(qdd : QuoteDataDTO) : QuoteDataDTO {
    final var sub = withBundledSubmission(qdd, \ s -> {
      updateDraft(s, qdd)
      return s
    })
    return toDTO(qdd.SessionUUID, sub)
  }

  /**
   * Updates, saves and performs a quote on an existing submission.
   * Generates quotes for all available product offerings.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>ISessionPlugin#validateAndRefreshSession(String,String)</code> - to pull the session id out of
   *       QuoteDataDTO where it validates whether the session is valid or not</dd>
   *   <dd><code>IDraftSubmissionPlugin#updateSubmission(Submission,DraftDataDTO)</code> - to update the submission with the DraftDataDTO</dd>
   *   <dd><code>IQuotePlugin#quote(Submission)</code> - to quote the submission</dd>
   *   <dd><code>IDraftSubmissionPlugin#toDTO(Submission)</code> - to re-generate the returned draft data from the submission</dd>
   *   <dd><code>IQuotePlugin#toDTO(Submission)</code> - to re-generate the returned quote data from the submission</dd>
   *   <dd><code>IBindingPlugin#getBindingData(Submission)</code> - to re-generate the binding data from the submission</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>ApplicationException</code> - If there are any underwriting exceptions</dd>
   * </dl>
   *
   * @param  qdd data that captures an existing submission
   * @return     the DTO for the updated submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID</dd>
   *               <dt>QuoteID</dt><dd>the JobNumber of the submission</dd>
   *               <dt>DraftData</dt><dd>the draft data DTO</dd>
   *               <dt>QuotingData</dt><dd>the quote data</dd>
   *               <dt>BindingData</dt><dd>the quote data</dd>
   *               <dt>IsSubmitAgent</dt><dd><code>null</code></dd>
   *             </dl>
   */
  @JsonRpcUnauthenticatedMethod
  @Context("AccountEmailRequired", Expr.const(true))
  public function saveAndQuote(qdd : QuoteDataDTO) : QuoteDataDTO {

        return saveAndQuotes(qdd)
  }

  /**
   * Updates, saves and performs a quote on an existing submission.
   * Generates a quote for the base offering only.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>ISessionPlugin#validateAndRefreshSession(String,String)</code> - to pull the session id out of
   *       QuoteDataDTO where it validates whether the session is valid or not</dd>
   *   <dd><code>IDraftSubmissionPlugin#updateSubmission(Submission,DraftDataDTO)</code> - to update the submission with the DraftDataDTO</dd>
   *   <dd><code>IQuotePlugin#quote(Submission)</code> - to quote the submission</dd>
   *   <dd><code>IDraftSubmissionPlugin#toDTO(Submission)</code> - to re-generate the returned draft data from the submission</dd>
   *   <dd><code>IQuotePlugin#toDTO(Submission)</code> - to re-generate the returned quote data from the submission</dd>
   *   <dd><code>IBindingPlugin#getBindingData(Submission)</code> - to re-generate the binding data from the submission</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>ApplicationException</code> - If there are any underwriting exceptions</dd>
   * </dl>
   *
   * @param  qdd data that captures an existing submission
   * @return     the DTO for the updated submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID</dd>
   *               <dt>QuoteID</dt><dd>the JobNumber of the submission</dd>
   *               <dt>DraftData</dt><dd>the draft data DTO</dd>
   *               <dt>QuotingData</dt><dd>the quote data</dd>
   *               <dt>BindingData</dt><dd>the quote data</dd>
   *               <dt>IsSubmitAgent</dt><dd><code>null</code></dd>
   *             </dl>
   */
  @JsonRpcUnauthenticatedMethod
  @Context("AccountEmailRequired", Expr.const(true))
  public function saveAndQuoteBaseOffering(qdd : QuoteDataDTO) : QuoteDataDTO {
    var sub = withBundledSubmission(qdd, \ s -> {
      updateDraft(s, qdd)
      return s
    })

    // Quote in a different bundle so draft data is saved even if quote fails.
    var uwExceptionEncounteredFlag = false
    Bundle.transaction(\ bundle -> {
      sub = bundle.add(sub)
      try{
        _quotingPlugin.quoteBaseOffering(sub, true)
      } catch(uwe : UnderwritingException) {
        LOGGER.logError(uwe);
        // Set flag for use later
        uwExceptionEncounteredFlag = true
      }
    })

    if(uwExceptionEncounteredFlag) {
      // Send generic underwriting message back to the client
      throw new UnderwritingException()
    }

    return toDTO(qdd.SessionUUID, sub)
  }

  protected function saveAndQuotes(qdd : QuoteDataDTO) : QuoteDataDTO {
    var sub = withBundledSubmission(qdd, \ s -> {
      updateDraft(s, qdd)
      return s
    })

    /* Quote in a different bundle so draft data is saved even
     * if quote fails.
     */
    Bundle.transaction(\ bundle -> {
      sub = bundle.add(sub)
      try{
        _quotingPlugin.quoteAllOfferings(sub, true)
      }
      catch(eve : EntityValidationException) {
        withdrawAllButOnePeriod(sub)
        //send generic entity validation message back to the client
        LOGGER.logError(eve);
        throw new EntityValidationException()
      }
      catch(uwe : UnderwritingException) {
        withdrawAllButOnePeriod(sub)
        LOGGER.logError(uwe);
        gw.transaction.Transaction.getCurrent().commit()
        //send generic underwriting message back to the client
        throw new UnderwritingException()
      }
    })

    return toDTO(qdd.SessionUUID, sub)
  }


  /**
   * Updates binding data on the submission
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>ISessionPlugin#validateAndRefreshSession(String,String)</code> - to pull the session id out of
   *       QuoteDataDTO where it validates whether the session is valid or not</dd>
   *   <dd><code>IBindingPlugin#updateBindingData(Submission,BindingDataDTO)</code> - to try update binding data on
   *       the submission</dd>
   *   <dd><code>IDraftSubmissionPlugin#toDTO(Submission)</code> - to re-generate the returned draft data from the submission</dd>
   *   <dd><code>IQuotePlugin#toDTO(Submission)</code> - to re-generate the returned quote data from the submission</dd>
   *   <dd><code>IBindingPlugin#getBindingData(Submission)</code> - to re-generate the binding data from the submission</dd>
   * </dl>
   *
   * @param  qdd data that captures an existing submission
   * @return     the DTO for the updated submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID</dd>
   *               <dt>QuoteID</dt><dd>the JobNumber of the submission</dd>
   *               <dt>DraftData</dt><dd>the draft data DTO</dd>
   *               <dt>QuotingData</dt><dd>the quote data</dd>
   *               <dt>BindingData</dt><dd>the quote data</dd>
   *               <dt>IsSubmitAgent</dt><dd><code>null</code></dd>
   *            </dl>
   */
  @JsonRpcUnauthenticatedMethod
  @Context("AccountEmailRequired", Expr.const(true))
  @Context("DriverEmailRequired", Expr.const(true))
  public function updateQuotedSubmission(qdd : QuoteDataDTO) : QuoteDataDTO {

    final var sub = withBundledSubmission(qdd, \ s -> {
      _bindingPlugin.updateBindingData(s, qdd.BindData)
      return s
    })
    return toDTO(qdd.SessionUUID, sub)
  }


  /**
   * Binds the submission
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>ISessionPlugin#validateAndRefreshSession(String,String)</code> - to pull the session id out of
   *       QuoteDataDTO where it validates whether the session is valid or not</dd>
   *   <dd><code>IBindingPlugin#preBind(Submission,BindingDataDTO)</code> - to update the submission before
   *       being bound</dd>
   *   <dd><code>IBindingPlugin#bind(Submission)</code> - to bind the submission</dd>
   *   <dd><code>IDraftSubmissionPlugin#toDTO(Submission)</code> - to re-generate the returned draft data from the submission</dd>
   *   <dd><code>IQuotePlugin#toDTO(Submission)</code> - to re-generate the returned quote data from the submission</dd>
   *   <dd><code>IBindingPlugin#getBindingData(Submission)</code> - to re-generate the binding data from the submission</dd>
   * </dl>
   *
   * @param  qdd data that captures an existing submission
   * @return     the DTO for the updated submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID</dd>
   *               <dt>QuoteID</dt><dd>the JobNumber of the submission</dd>
   *               <dt>DraftData</dt><dd>the draft data DTO</dd>
   *               <dt>QuotingData</dt><dd>the quote data</dd>
   *               <dt>BindingData</dt><dd>the quote data</dd>
   *               <dt>IsSubmitAgent</dt><dd><code>null</code></dd>
   *            </dl>
   */
  @JsonRpcUnauthenticatedMethod
  @Context("DriverEmailRequired", Expr.const(true))
  public function bind(qdd : QuoteDataDTO) : QuoteDataDTO {
    /* Perform update and binding in different transactions. */
    var sub = withBundledSubmission(qdd, \ s -> {
      _bindingPlugin.preBind(s, qdd.BindData)
      return s
    })

    Bundle.transaction(\ bundle -> {
      sub = bundle.add(sub)
      _bindingPlugin.bind(sub, qdd.BindData)
    })

    return toDTO(qdd.SessionUUID, sub)
  }

  /**
   * Retrieves a submission
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>ISessionPlugin#getSession(String)</code> - to get the session from the job number</dd>
   *   <dd><code>IDraftSubmissionPlugin#toDTO(Submission)</code> - to re-generate the returned draft data from the submission</dd>
   *   <dd><code>IQuotePlugin#toDTO(Submission)</code> - to re-generate the returned quote data from the submission</dd>
   *   <dd><code>IBindingPlugin#getBindingData(Submission)</code> - to re-generate the binding data from the submission</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>EntityNotFoundException</code> - if no submission can be found with a matching postal code</dd>
   * </dl>
   *
   * @param  qrd data that captures the information needed to retrieve a quote
   * @return     the DTO for the updated submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID</dd>
   *               <dt>QuoteID</dt><dd>the JobNumber of the submission</dd>
   *               <dt>DraftData</dt><dd>the draft data DTO</dd>
   *               <dt>QuotingData</dt><dd>the quote data</dd>
   *               <dt>BindingData</dt><dd>the quote data</dd>
   *               <dt>IsSubmitAgent</dt><dd><code>null</code></dd>
   *             </dl>
   */
  @JsonRpcUnauthenticatedMethod
  public function retrieve(qrd : QuoteRetrievalDTO) : QuoteDataDTO {
    final var sub = getSubmissionByJob(qrd.QuoteID)
    if (sub.Policy.Account.AccountHolderContact.PrimaryAddress.PostalCode != qrd.PostalCode) {
      throw new EntityNotFoundException() {: Message = "Submission not found" }
    }

    return toDTO(_sessionPlugin.getSession(sub.JobNumber), sub)
  }


  /**
   * Email submission
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>ISessionPlugin#validateAndRefreshSession(String,String)</code> - to pull the session id out of
   *       QuoteDataDTO where it validates whether the session is valid or not</dd>
   *   <dd><code>IDraftSubmissionPlugin#toDTO(Submission)</code> - to re-generate the returned draft data from the submission</dd>
   *   <dd><code>IQuotePlugin#toDTO(Submission)</code> - to re-generate the returned quote data from the submission</dd>
   *   <dd><code>IBindingPlugin#getBindingData(Submission)</code> - to re-generate the binding data from the submission</dd>
   *   <dd><code>IQuoteMailingPlugin#sendMail(Submission,QuoteDataDTO)</code> - to send the submission information in
   *       an email</dd>
   * </dl>
   *
   * @param qed data that captures the information needed to retrieve a submission
   */
  @JsonRpcUnauthenticatedMethod
  public function emailQuote(qed : QuoteEmailDTO) {
    _sessionPlugin.validateAndRefreshSession(qed.SessionID, qed.QuoteID)
    final var sub = getSubmissionByJob(qed.QuoteID)
    _quoteMailingPlugin.sendMail(sub, toDTO(qed.SessionID, sub))
  }




  /* PRIVATE IMPLEMENTATION. */
  protected function updateDraft(sub : Submission, qdd : QuoteDataDTO) {
    sub.SelectedVersion = QuoteUtil.getBasePeriod(sub)
    sub.SelectedVersion.SubmissionProcess.withdrawOtherActivePeriods()
    _draftPlugin.updateSubmission(sub, qdd.DraftData)
    if(sub.SelectedVersion.SubmissionProcess.canEdit().Okay){
      //If updateDraft is called with a quoted submission we want to put it back into edit mode as that previous quote
      //is no longer valid as we have made changes to the draft data
      sub.SelectedVersion.SubmissionProcess.edit()
    }
  }



  protected function toDTO(sessId : String, submission : Submission) : QuoteDataDTO {
    final var res = new QuoteDataDTO()
    res.SessionUUID = sessId
    res.QuoteID = submission.JobNumber
    res.DraftData = _draftPlugin.toDTO(submission.ResultingBoundPeriod == null ?
        QuoteUtil.getBasePeriod(submission) : submission.ResultingBoundPeriod)
    res.QuoteData = _quotingPlugin.toDTO(submission, false)
    res.BindData = _bindingPlugin.getBindingData(submission)
    return res
  }


  /**
   * Fetches a submission by its number.
   */
  protected function getSubmissionByJob(number : String) : Submission {
    final var foundSubmission = Query.make(Submission).compare("JobNumber", Equals, number).select().FirstResult
    if (foundSubmission == null || !SubmissionAuthorizer.canAccess(foundSubmission) ){
      throw new EntityNotFoundException() {: Message = "Submission not found" }
    }
    return foundSubmission
  }


  /**
   * Runs code within a transaction bundle.
   */
  protected function withBundledSubmission<T>(qdd : QuoteDataDTO, cb(sub : Submission) : T) : T {
    if(!_sessionPlugin.validateAndRefreshSession(qdd.SessionUUID, qdd.QuoteID)){
      throw new JsonRpcSecurityException(){:Message = "Invalid session"}
    }
    final var sub = getSubmissionByJob(qdd.QuoteID)
    return Bundle.resolveInTransaction(\ b -> cb(b.add(sub)))
  }


  protected function withdrawAllButOnePeriod(sub : Submission) {
    // if an Exception is thrown during quoting, we should withdraw all but one period
    final var base = QuoteUtil.getBasePeriod(sub)

    sub.SelectedVersion = base
    if (base.JobProcess != null) {
      base.JobProcess.withdrawOtherActivePeriods()
      if (base.Status == PolicyPeriodStatus.TC_QUOTING || base.Status == PolicyPeriodStatus.TC_QUOTED) {
        base.JobProcess.edit()
      }
    }
  }

}
