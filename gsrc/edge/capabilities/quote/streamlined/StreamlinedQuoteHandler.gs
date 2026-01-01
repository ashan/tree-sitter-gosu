package edge.capabilities.quote.streamlined

uses edge.capabilities.quote.session.ISessionPlugin
uses edge.jsonrpc.IRpcHandler
uses edge.security.authorization.Authorizer
uses edge.capabilities.quote.quoting.IQuotePlugin
uses edge.capabilities.quote.binding.IBindingPlugin
uses edge.capabilities.quote.mailing.IQuoteMailingPlugin
uses edge.capabilities.quote.lob.ILobMetadataPlugin
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.capabilities.quote.dto.QuoteDataDTO
uses edge.capabilities.quote.streamlined.dto.StreamlinedQuoteDTO
uses edge.capabilities.quote.questionset.util.QuestionSetUtil
uses edge.webapimodel.dto.PCWebApiModelDTO
uses edge.PlatformSupport.Bundle
uses edge.capabilities.quote.quoting.util.QuoteUtil
uses edge.capabilities.quote.quoting.exception.UnderwritingException
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses gw.api.database.Query
uses edge.exception.EntityNotFoundException

/**
 * Quoting handler. Manages quoting session.
 */
class StreamlinedQuoteHandler implements IRpcHandler  {

  /**
   * Draft submission plugin used in quote.
   */
  private var _draftPlugin : IStreamlinedSubmissionPlugin

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
  @Param("draftPlugin", "Plugin used to manage streamlined quote information")
  @Param("sessionPlugin", "Session management plugin")
  @Param("productAvailabilityPlugin", "Plugin to determine product availability for this capability")
  @Param("quotingPlugin", "Quoting process plugin implementation")
  @Param("bindingPlugin", "Binding process plugin")
  @Param("lobMetadataPlugin", "Plugin used to extend metadata generation")
  @Param("authorizer", "Authorizer added to check user can retrieve submission")
  construct(
        draftPlugin : IStreamlinedSubmissionPlugin,
        sessionPlugin : ISessionPlugin,
        quotingPlugin : IQuotePlugin,
        bindingPlugin : IBindingPlugin,
        lobMetadataPlugin : ILobMetadataPlugin,
        authorizer:IAuthorizerProviderPlugin) {
    this._draftPlugin = draftPlugin
    this._sessionPlugin = sessionPlugin
    this._quotingPlugin = quotingPlugin
    this._bindingPlugin = bindingPlugin
    this._lobMetadataPlugin = lobMetadataPlugin
    this._submissionAuthorizer = authorizer.authorizerFor(Submission)
  }

  @JsonRpcUnauthenticatedMethod
  function getMetaData() : Object {
    return PCWebApiModelDTO.forTypes(
        {QuoteDataDTO,StreamlinedQuoteDTO},
        _lobMetadataPlugin.getQuestionSetCodes().map(\qs -> QuestionSetUtil.getByCode(qs))
    )
  }

  /**
   * Creates new streamlined submission job and generates a session to be used during the submission process.
   * Generates quotes for all available product offerings.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IStreamlinedSubmissionPlugin#createSubmission(StreamlinedQuoteDTO)</code> - to create a new streamlined submission
   *   passing the draft data in <code>qdd</code></dd>
   *   <dd><code>IStreamlinedSubmissionPlugin#toDTO(Submission)</code> - to try to update the quote</dd>
   *   <dd><code>ISessionPlugin#getSeBundle.resolveInTransaction(\ b ->ssion(String)</code> - to create the session id which will be added to the
   *       returned dto</dd>
   * </dl>
   *
   * @param  qdd initial data to create the submission.
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
  public function create(qdd : StreamlinedQuoteDTO) : QuoteDataDTO {
    final var draft = Bundle.resolveInTransaction(\ b ->
      _draftPlugin.createSubmission(qdd)
    )
    final var sessId = _sessionPlugin.getSession(draft.JobNumber)
    return getQuoteAllOfferings(sessId, draft)
  }

  /**
   * Creates new streamlined submission job and generates a session to be used during the submission process.
   * Generates a quote for the base offering only.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IStreamlinedSubmissionPlugin#createSubmission(StreamlinedQuoteDTO)</code> - to create a new streamlined submission
   *   passing the draft data in <code>qdd</code></dd>
   *   <dd><code>IStreamlinedSubmissionPlugin#toDTO(Submission)</code> - to try to update the quote</dd>
   *   <dd><code>ISessionPlugin#getSeBundle.resolveInTransaction(\ b ->ssion(String)</code> - to create the session id which will be added to the
   *       returned dto</dd>
   * </dl>
   *
   * @param  qdd initial data to create the submission.
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
  public function createBaseOffering(qdd : StreamlinedQuoteDTO) : QuoteDataDTO {
    final var draft = Bundle.resolveInTransaction(\ b ->
        _draftPlugin.createSubmission(qdd)
    )
    final var sessId = _sessionPlugin.getSession(draft.JobNumber)
    return getQuoteBaseOffering(sessId, draft)
  }

  protected function getQuoteAllOfferings(uid : String, sub : Submission) : QuoteDataDTO {
    var uwExceptionEncounteredFlag = false
    Bundle.transaction(\ bundle -> {
      sub = bundle.add(sub)
      try {
        _quotingPlugin.quoteAllOfferings(sub, true)
      } catch(uwe : UnderwritingException) {
        //set flag for use later
        uwExceptionEncounteredFlag = true
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
    })

    if (uwExceptionEncounteredFlag) {
      // Send generic underwriting message back to the client
      throw new UnderwritingException()
    }

    return toDTO(uid, sub)
  }

  protected function getQuoteBaseOffering(uid : String, sub : Submission) : QuoteDataDTO {
    var uwExceptionEncounteredFlag = false
    Bundle.transaction(\ bundle -> {
      sub = bundle.add(sub)
      try {
        _quotingPlugin.quoteBaseOffering(sub, true)
      } catch(uwe : UnderwritingException) {
        // Set flag for use later
        uwExceptionEncounteredFlag = true
      }
    })

    if (uwExceptionEncounteredFlag) {
      // Send generic underwriting message back to the client
      throw new UnderwritingException()
    }

    return toDTO(uid, sub)
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
}
