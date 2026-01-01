package edge.capabilities.quote

uses edge.PlatformSupport.Bundle
uses edge.capabilities.quote.dto.QuoteDataDTO
uses edge.capabilities.quote.dto.QuoteRetrievalDTO
uses edge.capabilities.quote.quoting.util.QuoteUtil
uses edge.el.Expr
uses edge.aspects.validation.annotations.Context
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.di.annotations.InjectableNode
uses edge.capabilities.quote.draft.IDraftSubmissionPlugin
uses edge.capabilities.quote.session.ISessionPlugin
uses edge.capabilities.quote.quoting.IQuotePlugin
uses edge.capabilities.quote.binding.IBindingPlugin
uses edge.capabilities.quote.mailing.IQuoteMailingPlugin
uses edge.capabilities.quote.lob.ILobMetadataPlugin
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.capabilities.quote.quoting.exception.EntityValidationException
uses edge.capabilities.quote.quoting.exception.BlockQuoteUnderwritingException
uses edge.capabilities.quote.quoting.exception.UnderwritingException


class AgentQuoteHandler extends QuoteHandler{

  private var _quotingPlugin : IQuotePlugin
  private var _draftPlugin : IDraftSubmissionPlugin

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
    super(draftPlugin, sessionPlugin, quotingPlugin, bindingPlugin, quoteMailingPlugin, lobMetadataPlugin, authorizer)
    this._quotingPlugin = quotingPlugin
    this._draftPlugin = draftPlugin
  }

  /**
   * Updates, saves and performs a quote on an existing submission for an agent
   *
   * <p>
   * This implementation:
   * <ul>
   *   <li>uses injected instances of the following plugins:
   *       {@code ISessionPlugin}, {@code IDraftSubmissionPlugin}, {@code IQuotePlugin} and {@code IBindingPlugin}
   *   <li>calls {@code ISessionPlugin#validateAndRefreshSession(String,String)} pulling the session id out of
   *       {@code QuoteDataDTO} where it validates whether the session is valid or not
   *   <li>calls
   *       {@code IDraftSubmissionPlugin#updateSubmission(Submission,DraftDataDTO)}
   *       inside a transaction bundle to update the submission with the {@code DraftDataDTO}
   *   <li>calls {@code IQuotePlugin#quote(Submission)} and tries to quote the submission
   *   <li>calls {@code IDraftSubmissionPlugin#toDTO(Submission)} to re-generate the returned draft data
   *       from the submission
   *   <li>calls {@code IQuotePlugin#toDTO(Submission)} to re-generate the returned quote data from the submission
   *   <li>calls {@code IBindingPlugin#getBindingData(Submission)} to re-generate the binding data from the submission
   * </ul>
   * </p>
   *
   * @param  qdd data that captures an existing submission
   * @return     the DTO for the updated submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID</dd>
   *               <dt>QuoteID</dt><dd>the JobNumber of the submission</dd>
   *               <dt>DraftData</dt><dd>the draft data DTO</dd>
   *               <dt>QuotingData</dt><dd>the quote data</dd>
   *               <dt>BindingData</dt><dd>the quote data</dd>
   *               <dt>IsSubmitAgent</dt><dd>{@code null}</dd>
   *             </dl>
   * @throws     edge.exception.ApplicationException Rethrows any underwriting exceptions thrown by the
   *                                                          {@code IQuotePlugin}
   * @see        edge.capabilities.quote.session.ISessionPlugin#validateAndRefreshSession(java.lang.String,java.lang.String)
   * @see        edge.capabilities.quote.quoting.IQuotePlugin#quote(entity.Submission)
   * @see        edge.capabilities.quote.draft.IDraftSubmissionPlugin#toDTO(entity.Submission)
   * @see        edge.capabilities.quote.quoting.IQuotePlugin#toDTO(entity.Submission)
   * @see        edge.capabilities.quote.binding.IBindingPlugin#getBindingData(entity.Submission)
   * @since      4.0
   */

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @Context("AccountEmailRequired", Expr.const(false))
  override public function saveAndQuote(qdd : QuoteDataDTO) : QuoteDataDTO {

    return saveAndQuotes(qdd)
  }

  /**
   * Updates binding data on the submission
   *
   * <p>
   * This implementation:
   * <ul>
   *   <li>uses injected instances of the following plugins:
   *       {@code ISessionPlugin}, {@code IDraftSubmissionPlugin}, {@code IQuotePlugin} and {@code IBindingPlugin}
   *   <li>calls {@code ISessionPlugin#validateAndRefreshSession(String,String)} pulling the session id out of
   *       {@code QuoteDataDTO} where it validates whether the session is valid or not
   *   <li>calls {@code IBindingPlugin#updateBindingData(Submission,BindingDataDTO)} to try update binding data on
   *       the submission
   *   <li>calls {@code IDraftSubmissionPlugin#toDTO(Submission)} to re-generate the returned draft data
   *       from the submission
   *   <li>calls {@code IQuotePlugin#toDTO(Submission)} to re-generate the returned quote data from the submission
   *   <li>calls {@code IBindingPlugin#getBindingData(Submission)} to re-generate the binding data from the submission
   * </ul>
   * </p>
   *
   * @param  qdd data that captures an existing submission
   * @return     the DTO for the updated submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID</dd>
   *               <dt>QuoteID</dt><dd>the JobNumber of the submission</dd>
   *               <dt>DraftData</dt><dd>the draft data DTO</dd>
   *               <dt>QuotingData</dt><dd>the quote data</dd>
   *               <dt>BindingData</dt><dd>the quote data</dd>
   *               <dt>IsSubmitAgent</dt><dd>{@code null}</dd>
   *            </dl>
   * @see       edge.capabilities.quote.session.ISessionPlugin#validateAndRefreshSession(java.lang.String,java.lang.String)
   * @see       edge.capabilities.quote.draft.IDraftSubmissionPlugin#toDTO(entity.Submission)
   * @see       edge.capabilities.quote.quoting.IQuotePlugin#toDTO(entity.Submission)
   * @see       edge.capabilities.quote.binding.IBindingPlugin#getBindingData(entity.Submission)
   * @see       edge.capabilities.quote.binding.IBindingPlugin#updateBindingData(entity.Submission,edge.capabilities.quote.binding.BindingRequestDTO)
   * @since     3.0
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @Context("AccountEmailRequired", Expr.const(false))
  @Context("DriverEmailRequired", Expr.const(false))
  override public function updateQuotedSubmission(qdd : QuoteDataDTO) : QuoteDataDTO {

    final var sub = withBundledSubmission(qdd, \ s -> {
      _bindingPlugin.updateBindingData(s, qdd.BindData)
      return s
    })
    return toDTO(qdd.SessionUUID, sub)
  }

  /**
   * Updates an existing submission and saves the changes.
   *
   * <p>
   * This implementation:
   * <ul>
   *   <li>uses injected instances of the following plugins:
   *       {@code ISessionPlugin}, {@code IDraftSubmissionPlugin}, {@code IQuotePlugin} and {@code IBindingPlugin}
   *   <li>calls {@code ISessionPlugin#validateAndRefreshSession(String,String)} pulling the session id out of
   *       {@code QuoteDataDTO} where it validates whether the session is valid or not
   *   <li>calls
   *       {@code IDraftSubmissionPlugin#updateSubmission(Submission,DraftDataDTO)}
   *       inside a transaction bundle to update the submission with the {@code DraftDataDTO}
   *   <li>calls {@code IDraftSubmissionPlugin#toDTO(Submission)} to re-generate the returned draft data
   *       from the submission
   *   <li>calls {@code IQuotePlugin#toDTO(Submission)} to re-generate the returned quote data from the submission
   *   <li>calls {@code IBindingPlugin#getBindingData(Submission)} to re-generate the binding data from the submission
   * </ul>
   * </p>
   * @param  qdd data that captures an existing submission. This implementation only uses the information in
   *             {@code qrd.DraftData}
   * @return     the DTO for the updated submission. The contents of the returned value are as follows:
   *             <dl>
   *               <dt>SessionUUID</dt><dd>the session ID</dd>
   *                <dt>QuoteID</dt><dd>the JobNumber of the submission</dd>
   *                <dt>DraftData</dt><dd>the draft data DTO</dd>
   *                <dt>QuotingData</dt><dd>the quote data</dd>
   *                <dt>BindingData</dt><dd>the quote data</dd>
   *                <dt>IsSubmitAgent</dt><dd>{@code null}</dd>
   *             </dl>
   * @see        edge.capabilities.quote.session.ISessionPlugin#validateAndRefreshSession(java.lang.String, java.lang.String)
   * @see        edge.capabilities.quote.draft.IDraftSubmissionPlugin#toDTO(entity.Submission)
   * @see        edge.capabilities.quote.quoting.IQuotePlugin#toDTO(entity.Submission)
   * @see        edge.capabilities.quote.binding.IBindingPlugin#getBindingData(entity.Submission)
   * @see        edge.capabilities.quote.draft.IDraftSubmissionPlugin#updateSubmission(Submission,edge.capabilities.quote.draft.DraftDataDTO)
   * @since      3.0
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @Context("AccountDOBRequired", Expr.const(false))
  override public function save(qdd : QuoteDataDTO) : QuoteDataDTO {
    final var sub = withBundledSubmission(qdd, \ s -> {
      updateDraft(s, qdd)
      return s
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

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public override function retrieve(qrd : QuoteRetrievalDTO) : QuoteDataDTO {
    return super.retrieve(qrd)
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
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @Context("DriverEmailRequired", Expr.const(true))
  public override function bind(qdd : QuoteDataDTO) : QuoteDataDTO {
    return super.bind(qdd)
  }

  override protected function saveAndQuotes(qdd : QuoteDataDTO) : QuoteDataDTO {
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
      } catch(eve : EntityValidationException) {
        withdrawAllButOnePeriod(sub)
        //send generic entity validation message back to the client
        throw new EntityValidationException()
      } catch(uwe : BlockQuoteUnderwritingException) {
        withdrawAllButOnePeriod(sub)
        throw new UnderwritingException(uwe)
      } catch(uwe : UnderwritingException) {

      }
    })

    return toDTO(qdd.SessionUUID, sub)
  }

  override protected function toDTO(sessId : String, submission : Submission) : QuoteDataDTO {
    final var res = new QuoteDataDTO()
    res.SessionUUID = sessId
    res.QuoteID = submission.JobNumber
    res.DraftData = _draftPlugin.toDTO(submission.ResultingBoundPeriod == null ?
        QuoteUtil.getBasePeriod(submission) : submission.ResultingBoundPeriod)
    res.QuoteData = _quotingPlugin.toDTO(submission, true)
    res.BindData = _bindingPlugin.getBindingData(submission)
    return res
  }
}
