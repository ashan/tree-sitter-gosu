package nz.co.acc.gwer.databeans

uses java.io.Serializable

class TransferClaimData_ACC implements Serializable {

  private var _claimNumber : String as ClaimNumber
  private var _accidentDate : Date as AccidentDate
  private var _claimantName : String as ClaimantName
  private var _transferClaimID : Long as TransferClaimID
  private var _transferBuyerID : Long as TransferBuyerID
  private var _buyerLevyPayerID : Long as BuyerLevyPayerID
  private var _buyerACCPolicyID : String as BuyerACCPolicyID
  private var _cuCode : String as CUCode

  private var _initialBuyerACCPolicyID : String as InitialBuyerACCPolicyID

}