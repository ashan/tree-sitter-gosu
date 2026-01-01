package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload for the Account-level flags. There is no guideiwre entity that maps to this. The flags are determined at runtime.
 * This payload is constructed based on the API Management's REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONAccountFlag {
  public var ACCID: String
  public var FlagName: String
  public var IsActive: boolean
  public var UpdateTime: String
}