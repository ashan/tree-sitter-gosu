package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * JSON Payload pojo for the Account entity. This payload is constructed based on the API Management's
 * REST WebService interface for the Guidewire Applications.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONAccount {
  public var LinkID: String
  public var ACCID: String
  public var IRNumber: String
  public var NZBN: String
  public var TradingName: String
  public var IsRestricted: boolean
  public var IsAEPContractAccount: boolean
  public var AEPContractNumber: String
  public var AccountStatus: String
  public var OrganisationType: String
  public var UserRoleAssignments: JSONAccountUserRoleAssignment[]
  public var AccountContacts: JSONAccountContact[]
  public var UpdateTime: String
}