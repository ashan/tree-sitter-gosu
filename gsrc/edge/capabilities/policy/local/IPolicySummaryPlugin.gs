package edge.capabilities.policy.local
uses java.util.Date
uses edge.capabilities.policy.dto.PolicySummaryDTO

/**
 * Plugin used to generate policy summary information.
 * <p>This plugin do not  perform policy access check. It just
 * summarizes a policy data.
 */
interface IPolicySummaryPlugin {
  
  /**
   * Generates a policy summary for the given policy and "today" date.
   * Current date may be used to find active policy lines and exclude
   * policy lines in the past.
   */
  public function getPolicySummary(policy : Policy, nowDate : Date) : PolicySummaryDTO
}
