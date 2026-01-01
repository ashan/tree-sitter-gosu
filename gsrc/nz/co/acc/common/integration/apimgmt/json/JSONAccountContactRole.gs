package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload pojo for the AccountContactRole entity. This payload is constructed based on the API Management's
 * REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONAccountContactRole {
  public var LinkID: String
  public var RoleName: String
  public var RelationToAccount: String
  public var Comments: String
  public var UpdateTime: String
}