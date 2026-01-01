package edge.capabilities.policy

uses edge.capabilities.policy.dto.PolicySummaryDTO

uses java.util.Date

uses edge.security.authorization.exception.NoAuthorityException
uses gw.api.webservice.exception.BadIdentifierException
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.IRpcHandler
uses edge.capabilities.policy.local.IPolicySummaryPlugin
uses edge.capabilities.policy.local.IPolicyPlugin
uses edge.capabilities.policy.dto.PolicyPeriodDTO
uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.policy.util.PolicyUtil
uses edge.capabilities.helpers.AccountUtil
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.security.EffectiveUserProvider

/**
 * Handles the RPC request to do with a Policy
 */
class PolicyHandler implements IRpcHandler {
  private var _policySummaryPlugin: IPolicySummaryPlugin
  private var _policyPlugin: IPolicyPlugin
  private var _policyAccessPlugin: IPolicyAccessPlugin
  private var _userProvider: EffectiveUserProvider as readonly UserProvider
  @InjectableNode
  @Param("policySummaryPlugin", "Plugin used to get a policy summary information")
  @Param("policyPlugin", "Plugin used to fetch detailed information about policy periods")
  @Param("policyAccessPlugin", "Plugin used to validate policy access rules")
  construct(policySummaryPlugin: IPolicySummaryPlugin, policyPlugin: IPolicyPlugin, policyAccessPlugin: IPolicyAccessPlugin,
            aUserProvider: EffectiveUserProvider) {
    this._policySummaryPlugin = policySummaryPlugin
    this._policyPlugin = policyPlugin
    this._policyAccessPlugin = policyAccessPlugin
    this._userProvider = aUserProvider
  }

  /**
   * Get summaries of policies belonging to the account of the effective user making the request
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyAccessPlugin#hasAccess(PolicyPeriod)</code> - to check if the effective user can access this policy</dd>
   *   <dd><code>IPolicyPlugin#getPolicySummary(PolicyPeriod)</code> - to get a summary of a policy</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>BadIdentifierException</code> - if the policy does not exist or cannot be accessed by the user</dd>
   * </dl>
   *
   * @returns a list of policy summaries
   */
  @JsonRpcMethod
  public function getAccountPolicySummaries(): PolicySummaryDTO[] {
    final var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)
    final var nowDate = new Date()

    return account.Policies
        .where(\policy -> _policyAccessPlugin.hasAccess(policy) && !policy.LatestPeriod.Canceled)
        .map(\policy -> _policySummaryPlugin.getPolicySummary(policy, nowDate))
        .where(\summary -> summary.Periods.Count > 0)
  }

  /**
   * Get details of a policy belonging to the account of the effective user making the request
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IPolicyAccessPlugin#hasAccess(PolicyPeriod)</code> - to check if the effective user can access this policy</dd>
   *   <dd><code>IPolicyPlugin#getPolicyPeriodDetails(PolicyPeriod)</code> - to get the details for the policy</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>BadIdentifierException</code> - if the policy does not exist or cannot be accessed by the user</dd>
   * </dl>
   *
   * @param policyNumber a policy number identifying the policy for which details are to be retrieved
   * @returns details for a policy
   */
  @JsonRpcMethod
  public function getAccountPolicyDetails(policyNumber: String): PolicyPeriodDTO {
    final var period = PolicyUtil.getLatestPolicyPeriodByPolicyNumber(policyNumber)

    if (!_policyAccessPlugin.hasAccess(period)) {
      throw new NoAuthorityException()
    }

    if (period == null) {
      throw new BadIdentifierException("Can not find currently active policy period for " + policyNumber)
    }

    return _policyPlugin.getPolicyPeriodDetails(period)
  }
}
