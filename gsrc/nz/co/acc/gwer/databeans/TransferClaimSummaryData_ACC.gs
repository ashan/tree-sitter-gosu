package nz.co.acc.gwer.databeans

uses java.io.Serializable

class TransferClaimSummaryData_ACC implements Serializable {

  private var _accPolicyID : String as ACCPolicyID
  private var _role : String as Role
  private var _claimsCount : Integer as ClaimsCount

}