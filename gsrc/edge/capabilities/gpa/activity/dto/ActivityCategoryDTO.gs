package edge.capabilities.gpa.activity.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Required

class ActivityCategoryDTO {

  @JsonProperty
  var _code : String as Code

  @JsonProperty
  var _name : String as Name

  @JsonProperty  @Size(0, 1333)
  var _description : String as Description

  @JsonProperty  @Required
  var _priority : int as Priority

  @JsonProperty
  var _retired : Boolean as Retired
}
