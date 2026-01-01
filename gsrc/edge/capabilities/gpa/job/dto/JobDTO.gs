package edge.capabilities.gpa.job.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.gpa.policy.dto.PolicyPeriodDTO
uses edge.capabilities.gpa.policy.dto.PolicyDTO
uses java.util.Date

class JobDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _jobNumber : String as JobNumber

  @JsonProperty
  var _createTime : Date as CreateTime

  @JsonProperty
  var _closeDate : Date as CloseDate

  @JsonProperty
  var _policy : PolicyDTO as Policy

  @JsonProperty
  var _status : String as Status

  @JsonProperty
  var _latestPeriod : PolicyPeriodDTO as LatestPeriod

  @JsonProperty
  var _description : String as Description

  @JsonProperty
  var _type : typekey.Job as Type

  @JsonProperty
  var _displayType : String as DisplayType

  @JsonProperty
  var _comment : String as Comment

  @JsonProperty
  var _canUserView : Boolean as CanUserView

  @JsonProperty
  var _createdByMe : Boolean as CreatedByMe

  @JsonProperty
  var _underwritingIssues : UWIssueDTO[] as UnderwritingIssues

  @JsonProperty
  var _isEditLocked : Boolean as IsEditLocked

  @JsonProperty
  var _statusCode : PolicyPeriodStatus as StatusCode
}
