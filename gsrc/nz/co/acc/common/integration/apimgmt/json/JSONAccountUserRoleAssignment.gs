package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload pojo for the AccountUserRoleAssignment entity. This payload is constructed based on the API Management's
 * REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONAccountUserRoleAssignment {
  public var LinkID: String
  public var RoleName: String
  public var User: JSONUser
  public var UpdateTime: String
}