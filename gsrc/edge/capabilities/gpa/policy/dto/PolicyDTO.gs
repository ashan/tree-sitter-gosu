package edge.capabilities.gpa.policy.dto

uses edge.capabilities.gpa.product.dto.ProductDTO
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.gpa.account.dto.AccountDTO
uses java.util.Date

class PolicyDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _account : AccountDTO as Account

  @JsonProperty
  var _periods : PolicyPeriodDTO[] as Periods

  @JsonProperty
  var _policyNumber : String as PolicyNumber

  @JsonProperty
  var _latestPeriod : PolicyPeriodDTO as LatestPeriod

  @JsonProperty
  var _issueDate : Date as IssueDate

  @JsonProperty
  var _issued : boolean as Issued

  @JsonProperty
  var _canUserView : boolean as CanUserView

  @JsonProperty
  var _numberOfOpenActivities : int as NumberOfOpenActivities

  @JsonProperty
  var _numberOfNotes : int as NumberOfNotes

  @JsonProperty
  var _numberOfOpenDocuments : int as NumberOfDocuments

  @JsonProperty
  var _numberOfOpenClaims : int as NumberOfOpenClaims

  @JsonProperty
  var _product : ProductDTO as Product

}
