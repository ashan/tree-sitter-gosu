package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload pojo for the Accreditation_ACC entity. This payload is constructed based on the API Management's
 * REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONAccreditation {
  public var LinkID: String
  public var CompanyName: String
  public var Type: String
  public var Number: String
  public var UpdateTime: String
}