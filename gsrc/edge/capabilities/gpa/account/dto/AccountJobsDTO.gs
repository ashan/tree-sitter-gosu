package edge.capabilities.gpa.account.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.gpa.job.dto.JobSummaryDTO

/**
 * Performance DTO used for GPA's Policies Landing Page
 *
 * Holds minimum data required for jobs associated with an account
 */
class AccountJobsDTO {

  @JsonProperty
  var _openSubmissions : JobSummaryDTO[] as OpenSubmissions

  @JsonProperty
  var _openPolicyChanges : JobSummaryDTO[] as OpenPolicyChanges

  @JsonProperty
  var _openRenewals : JobSummaryDTO[] as OpenRenewals

  @JsonProperty
  var _openCancellations : JobSummaryDTO[] as OpenCancellations
}
