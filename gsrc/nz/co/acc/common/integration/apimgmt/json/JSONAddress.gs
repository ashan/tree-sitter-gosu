package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload pojo for the Address entity. This payload is constructed based on the API Management's
 * REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONAddress {
  public var LinkID: String
  public var AddressLine1: String
  public var AddressLine2: String
  public var AddressLine3: String
  public var PostCode: String
  public var AttnOrCo: String
  public var City: String
  public var State: String
  public var Country: String
  public var Type: String
  public var LocationType: String
  public var UpdateTime: String
}