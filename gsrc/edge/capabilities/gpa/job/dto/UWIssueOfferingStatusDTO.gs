package edge.capabilities.gpa.job.dto

uses edge.jsonmapper.JsonProperty

class UWIssueOfferingStatusDTO {

  @JsonProperty
  var offering : String as Offering

  @JsonProperty
  var _hasApprovalOrRejection : Boolean as HasApprovalOrRejection

  @JsonProperty
  var _currentBlockingPoint: typekey.UWIssueBlockingPoint as CurrentBlockingPoint
}
