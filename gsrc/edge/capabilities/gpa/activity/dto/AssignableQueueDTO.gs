package edge.capabilities.gpa.activity.dto

uses edge.jsonmapper.JsonProperty

class AssignableQueueDTO {

  @JsonProperty
  var _displayName : String as DisplayName

  @JsonProperty
  var _name: String as Name

}
