package edge.capabilities.policy.dto
uses edge.capabilities.policy.dto.PolicyPeriodSummaryDTO
uses edge.jsonmapper.JsonProperty

/**
 * Summary information about the policy.
 */
class PolicySummaryDTO {
  /**
   * Policy periods associated with this property. 
   * Only the MostRecentModel periods are present for
   * each contractual period.
   */
  @JsonProperty
  var _periods : PolicyPeriodSummaryDTO[] as Periods;
}
