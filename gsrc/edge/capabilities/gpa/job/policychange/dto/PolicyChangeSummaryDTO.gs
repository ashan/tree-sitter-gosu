package edge.capabilities.gpa.job.policychange.dto

uses edge.jsonmapper.JsonProperty

class PolicyChangeSummaryDTO {

  @JsonProperty
  var _numberOfNotes : int as NumberOfNotes

  @JsonProperty
  var _numberOfDocuments : int as NumberOfDocuments

  @JsonProperty
  var _numberOfUWIssues : int as NumberOfUWIssues

  @JsonProperty
  var _numberOfOpenActivities : int as NumberOfOpenActivities
}
