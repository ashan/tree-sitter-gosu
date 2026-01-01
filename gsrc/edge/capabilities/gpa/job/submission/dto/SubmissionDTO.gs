package edge.capabilities.gpa.job.submission.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.FutureDate
uses edge.capabilities.gpa.job.dto.JobDTO
uses edge.aspects.validation.annotations.Required

class SubmissionDTO extends JobDTO{

  @JsonProperty @Required
  var _product : typekey.PolicyLine as Product

  @JsonProperty @Required @FutureDate
  var _periodStartDate : Date as PeriodStartDate

}
