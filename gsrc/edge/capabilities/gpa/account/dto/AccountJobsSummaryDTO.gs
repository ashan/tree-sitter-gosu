package edge.capabilities.gpa.account.dto

uses java.lang.Integer
uses edge.jsonmapper.JsonProperty

class AccountJobsSummaryDTO {

  @JsonProperty
  var _producerCode : String as ProducerCode

  @JsonProperty
  var _openSubmissions : Integer as OpenSubmissions

  @JsonProperty
  var _openPolicyChanges : Integer as OpenPolicyChanges

  @JsonProperty
  var _openCancellations : Integer as OpenCancellations

  @JsonProperty
  var _openRenewals : Integer as OpenRenewals

}
