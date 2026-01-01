package edge.capabilities.gpa.job.dto

uses edge.jsonmapper.JsonProperty

class JobTypeDTO {

  @JsonProperty
  var _type : typekey.Job as Type

}
