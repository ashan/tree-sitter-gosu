package edge.capabilities.gpa.job.policychange.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses edge.capabilities.gpa.job.dto.JobDTO

class PolicyChangeDTO extends JobDTO{

  @JsonProperty
  var _policyNumber : String as PolicyNumber

  @JsonProperty @Required
  var _effectiveDate : Date as EffectiveDate

  @JsonProperty
  var _description : String as Description
}
