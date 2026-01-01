package edge.capabilities.gpa.security.dto

uses edge.jsonmapper.JsonProperty

class SystemPermissionDTO {

  @JsonProperty
  var _permission : typekey.SystemPermissionType as Permission

  @JsonProperty
  var _permissions : typekey.SystemPermissionType[] as Permissions

}
