package edge.capabilities.gpa.security.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

class PermissionCheckDTO {

  @JsonProperty
  @Required
  var _permEntityType : String as PermEntityType

  @JsonProperty
  var _permEntityID : String as PermEntityID

  @JsonProperty
  @Required
  var _permission : String as Permission

  @JsonProperty
  @Required
  var _isCheckPermEntity : boolean as IsCheckPermEntity


}
