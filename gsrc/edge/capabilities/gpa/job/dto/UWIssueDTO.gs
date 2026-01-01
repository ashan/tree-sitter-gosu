package edge.capabilities.gpa.job.dto

uses edge.jsonmapper.JsonProperty

class UWIssueDTO {
  @JsonProperty
  var _longDescription : String as LongDescription

  @JsonProperty
  var _shortDescription : String as ShortDescription

  @JsonProperty
  var _approvalBlockingPoint : typekey.UWIssueBlockingPoint as ApprovalBlockingPoint

  @JsonProperty
  var _hasApprovalOrRejection : Boolean as HasApprovalOrRejection

  @JsonProperty
  var _currentBlockingPoint: typekey.UWIssueBlockingPoint as CurrentBlockingPoint

  @JsonProperty
  var _offerings : String[] as Offerings

  @JsonProperty
  var _onOfferings : UWIssueOfferingStatusDTO [] as OnOfferings
}
