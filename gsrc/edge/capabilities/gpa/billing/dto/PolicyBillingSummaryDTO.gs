package edge.capabilities.gpa.billing.dto

uses edge.jsonmapper.JsonProperty

class PolicyBillingSummaryDTO {

  @JsonProperty
  var _policyPeriodBillingSummaries : PolicyPeriodBillingSummaryDTO[] as PolicyPeriodBillingSummaries

}
