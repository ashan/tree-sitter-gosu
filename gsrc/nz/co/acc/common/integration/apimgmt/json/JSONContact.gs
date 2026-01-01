package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload pojo for the Contact entity. This payload is constructed based on the API Management's
 * REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONContact {
  public var LinkID: String
  public var Type: String
  public var ACCID: String

  public var Name: String
  public var Title: String
  public var FirstName: String
  public var MiddleName: String
  public var LastName: String
  public var Gender: String
  public var DateOfBirth: String

  public var PrimaryAddress: JSONAddress
  public var HomePhone: JSONPhoneNumber
  public var WorkPhone: JSONPhoneNumber
  public var MobilePhone: JSONPhoneNumber
  public var PrimaryPhone: String
  public var PrimaryEmail: String
  public var SecondaryEmail: String

  public var Accreditations: JSONAccreditation[]

  public var UpdateTime: String
}