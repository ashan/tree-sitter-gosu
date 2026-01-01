package edge.capabilities.policychange

uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.capabilities.policy.util.PolicyUtil
uses edge.capabilities.policychange.bind.IPolicyChangeBindPlugin
uses edge.capabilities.policychange.bind.dto.PolicyChangeBindDTO
uses edge.capabilities.policychange.draft.IPolicyChangeDraftPlugin
uses edge.capabilities.policychange.dto.PaymentDetailsDTO
uses edge.capabilities.policychange.dto.PolicyChangeDTO
uses edge.capabilities.policychange.dto.PolicySummaryDTO
uses edge.capabilities.policychange.dto.TransactionDTO
uses edge.capabilities.policychange.quote.IPolicyChangeQuotePlugin
uses edge.capabilities.quote.lob.dto.QuoteLobDataDTO
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.security.authorization.exception.NoAuthorityException
uses edge.time.LocalDateDTO
uses gw.api.webservice.exception.BadIdentifierException

class AgentPolicyChangeHandler extends PolicyChangeHandler {

  private var _policyAccessPlugin: IPolicyAccessPlugin

  @InjectableNode
  construct(authorizer: IAuthorizerProviderPlugin, retrievalPlugin: IPolicyChangeRetrievalPlugin,
            draftPlugin: IPolicyChangeDraftPlugin, quotingPlugin: IPolicyChangeQuotePlugin,
            bindingPlugin: IPolicyChangeBindPlugin, aUserProvider: EffectiveUserProvider, policyAccessPlugin: IPolicyAccessPlugin) {

    super(authorizer, retrievalPlugin, draftPlugin, quotingPlugin, bindingPlugin, aUserProvider)
    this._policyAccessPlugin = policyAccessPlugin
  }

  /**
   * Returns the  PolicySummaryDTO
   *
   * @returns a PolicySummaryDTO containing the policy
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function getAvailablePolicy(policyNumber: String): PolicySummaryDTO {

    final var period = PolicyUtil.getLatestPolicyPeriodByPolicyNumber(policyNumber)

    if (!_policyAccessPlugin.hasAccess(period)) {
      throw new NoAuthorityException()
    }

    if (period == null || !period.Policy.Issued) {
      throw new BadIdentifierException("Can not find currently active / issued policy period for " + policyNumber)
    }

    return populatePolicySummaryDTO(period.Policy)
  }

  /**
   * Returns the list of all the policies in the account.
   *
   * @returns a PolicySummaryDTO containing policies for an account
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function getAvailablePolicies(): PolicySummaryDTO[] {
    return super.getAvailablePolicies()
  }

  /**
   * Returns a DTO with the policy change details for the requested policy.
   * <p>
   * DTO generation is delegated to an instance of <code>IPolicyChangeDraftPlugin</code>
   * If the retrieved policy period belongs to an pending policy change transaction, it will call <code>IPolicyChangeDraftPlugin#toDto(entity.PolicyChange)</code>
   * passing the PolicyChange transaction, otherwise it will call <code>IPolicyChangeDraftPlugin#toDto(entity.PolicyPeriod)</code>.
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String)</code> - to retrieve the policy change</dd>
   * <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyPeriod)</code> - to provide the policy change as a DTO</dd>
   * </dl>
   *
   * @param policyNumber the policy number identifying the policy from which the change is to be loaded
   * @returns details for a policy change
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function load(policyNumber: String): TransactionDTO {
    return super.load(policyNumber)
  }

  /**
   * Updates or creates a policy change to match a policy change DTO.
   * <p>
   * If the policy period returned by the retrieval plugin is not associated to a pending policy change transaction,
   * this implementation creates a new policy change transaction. Otherwise it updates the policy period for
   * the change transaction.
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String)</code> - to retrieve the policy change</dd>
   * <dd><code>IPolicyChangeDraftPlugin#updateFromDto(PolicyChange, PolicyChangeDTO)</code> - to update the policy change from the DTO</dd>
   * <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyPeriod)</code> - to provide the policy change as a DTO</dd>
   * <dt>Throws:</dt>
   * <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid</dd>
   * </dl>
   *
   * @param changeDto details for the policy change that is to be saved
   * @returns details for the saved policy change
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function save(changeDto: TransactionDTO): TransactionDTO {
    return super.save(changeDto)
  }

  /**
   * Updates the coverages for a policy change
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   * <dd><code>IPolicyChangeDraftPlugin#updateCoveragesFromDto(PolicyPeriod, QuoteLobDataDTO)</code> - to update the coverages</dd>
   * <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   * </dl>
   *
   * @param jobNumber a job number identifying the policy change for which coverages are to be updated
   * @param coverages details of the current policy change
   * @returns policy change details with updated coverages
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function updateCoverages(jobNumber: String, coverages: QuoteLobDataDTO): TransactionDTO {
    return super.updateCoverages(jobNumber, coverages)
  }

  /**
   * Quotes a policy change
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   * <dd><code>IPolicyChangeQuotePlugin#quote(PolicyChange)</code> - to quote the policy change</dd>
   * <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   * <dt>Throws:</dt>
   * <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid or the effective date is in the past</dd>
   * <dd><code>UnderwritingException</code> - if there was an underwriting issue preventing the quote</dd>
   * </dl>
   *
   * @param jobNumber a job number identifying the policy change that is to be quoted
   * @returns details of the quoted policy change
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function quote(jobNumber: String): TransactionDTO {
    return super.quote(jobNumber)
  }

  /**
   * Binds a policy change
   * If there is any transaction cost associated to this policy change, process the payment for the policy change. If the payment is successful then the policy change is bound.
   * If the policy has a pending draft renewal job, this operation will also try to apply the change to the renewal.
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   * <dd><code>IPolicyChangeBindPlugin#bind(PolicyChange, PaymentDetailsDTO)</code> - to bind the policy change</dd>
   * <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   * <dt>Throws:</dt>
   * <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid</dd>
   * <dd><code>PolicyChangeUnderwritingException</code> - if there was an underwriting issue preventing the bind</dd>
   * </dl>
   *
   * @param jobNumber      a job number identifying the policy change that is to be bound
   * @param paymentDetails details for how the bound change should be made
   * @returns details of the bound policy change
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function bind(jobNumber: String, paymentDetails: PaymentDetailsDTO): PolicyChangeBindDTO {
    return super.bind(jobNumber, paymentDetails)
  }

  /**
   * Withdraws a policy change
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IPolicyChangeRetrievalPlugin#retrieveByJobNumber(String)</code> - to retrieve the policy change</dd>
   * <dd><code>IPolicyChangeDraftPlugin#toDto(PolicyChange)</code> - to provide the policy change as a DTO</dd>
   * <dt>Throws:</dt>
   * <dd><code>JsonRpcInvalidRequestException</code> - if the job number is invalid</dd>
   * <dd><code>PolicyChangeUnderwritingException</code> - if there was an underwriting issue preventing the withdraw</dd>
   * </dl>
   *
   * @param jobNumber a job number identifying the policy change that is to be withdrawn
   * @returns details of the withdrawn policy change
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function withdraw(jobNumber: String): TransactionDTO {
    return super.withdraw(jobNumber)
  }

  /**
   * Checks if a date would be valid as an effective date for a given policy
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String)</code> - to retrieve the policy change</dd>
   * </dl>
   *
   * @param policyNumber a policy number identifying the policy against which the date should be checked
   * @param checkDate    a date that will be validated as a possible effective date for the given policy
   * @returns true if the date can be used as an effective date for the given policy, false otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function checkEffectiveDateIsValid(policyNumber: String, checkDate: LocalDateDTO): Boolean {
    return super.checkEffectiveDateIsValid(policyNumber, checkDate)
  }


}
