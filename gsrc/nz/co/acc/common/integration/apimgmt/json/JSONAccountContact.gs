package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload pojo for the AccountContact entity. This payload is constructed based on the API Management's
 * REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONAccountContact {
  public var LinkID: String
  public var Active: boolean
  public var PrimaryContact: Long
  public var Primary: boolean
  public var Contact: JSONContact
  public var AccountContactRoles: JSONAccountContactRole[]
  public var UpdateTime: String
}