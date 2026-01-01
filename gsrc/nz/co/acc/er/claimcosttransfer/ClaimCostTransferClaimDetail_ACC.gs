package nz.co.acc.er.claimcosttransfer

uses java.io.Serializable

/**
 * Claim cost transfer claim details
 */
class ClaimCostTransferClaimDetail_ACC implements Serializable {
  private var _claimType : String as ClaimType
  private var _claimNumber : String as ClaimNumber
  private var _accNumber : String as ACCNumber
  private var _accountName : String as AccountName
  private var _accPolicyID : String as ACCPolicyID
}