package edge.capabilities.gpa.claim.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date

class ClaimSummaryDTO {

  @JsonProperty
  var _claimNumber : String as ClaimNumber

  @JsonProperty
  var _policyNumber : String as PolicyNumber

  @JsonProperty
  var _product : String as Product

  @JsonProperty
  var _lossDate : Date as LossDate

  @JsonProperty
  var _status : String as Status

}
