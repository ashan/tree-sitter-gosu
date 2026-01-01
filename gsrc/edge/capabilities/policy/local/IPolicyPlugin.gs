package edge.capabilities.policy.local
uses edge.capabilities.policy.dto.PolicyPeriodDTO

/**
 * Plugin used to provide information about policies.
 * <p>This plugin do not check policy access rules. It just converts
 * policy to policy data.
 */
interface IPolicyPlugin {
  /**
   * Fetches a policy details for the given policy period.
   */
  public function getPolicyPeriodDetails(info : PolicyPeriod) : PolicyPeriodDTO
}
