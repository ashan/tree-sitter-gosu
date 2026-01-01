package edge.capabilities.gpa.activity.dto

uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty

class ActivityPatternDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _code : String as Code

  @JsonProperty  @Size(0, 1333)
  var _description : String as Description

  @JsonProperty
  var _priority : Priority as Priority

  @JsonProperty
  var _recurring : Boolean as Recurring

  @JsonProperty
  var _mandatory : Boolean as Mandatory

  @JsonProperty
  var _dueDate : Date as DueDate

  @JsonProperty
  var _escalationDate : Date as EscalationDate

  @JsonProperty  @Size(1, 255)
  var _subject : String as Subject

  @JsonProperty
  var _category : ActivityCategoryDTO as Category
}
