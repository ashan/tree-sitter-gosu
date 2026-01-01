package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload pojo to represent Phone Numbers. This payload is constructed based on the API Management's
 * REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONPhoneNumber {

  construct(cc: String, pn: String, ext: String, cmb: String) {
    CountryCode = cc
    PhoneNumber = pn
    Extension = ext
    Combined = cmb
  }

  public var CountryCode: String
  public var PhoneNumber: String
  public var Extension: String
  public var Combined: String
}