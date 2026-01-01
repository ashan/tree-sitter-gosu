package nz.co.acc.er.claimcosttransfer

uses java.io.Serializable

class ClaimCostTransferSearchResult_ACC implements Serializable {
  private var _claimCostTransferID : Integer as ClaimCostTransferID
  private var _accNumber : String as ACCNumber
  private var _policyNumber : String as PolicyNumber
  private var _fromClaim : String as FromClaim
  private var _toClaim : String as ToClaim
  private var _startDate : Date as StartDate
  private var _endDate : Date as EndDate
  private var _description : String as Description
  private var _createDate : Date as CreateDate
  private var _createdBy : String as CreatedBy
  private var _modifiedDate : Date as ModifiedDate
  private var _modifiedBy : String as ModifiedBy
  private var _fromClaimACCNumber : String as FromClaimACCNumber
  private var _fromClaimAccountName : String as FromClaimAccountName
  private var _fromClaimACCPolicyID : String as FromClaimACCPolicyID
  private var _toClaimACCNumber : String as ToClaimACCNumber
  private var _toClaimAccountName : String as ToClaimAccountName
  private var _toClaimACCPolicyID : String as ToClaimACCPolicyID

  construct() {}

  construct(copyObject : ClaimCostTransferSearchResult_ACC) {
    copyValues(copyObject)
  }

  property get ValidFromClaim() : boolean {
    return FromClaim != null and !FromClaim.Empty
        and FromClaimACCNumber != null and !FromClaimACCNumber.Empty
        and FromClaimAccountName != null and !FromClaimAccountName.Empty
        and FromClaimACCPolicyID != null and !FromClaimACCPolicyID.Empty
  }

  property get ValidToClaim() : boolean {
    return ToClaim != null and !ToClaim.Empty
        and ToClaimACCNumber != null and !ToClaimACCNumber.Empty
        and ToClaimAccountName != null and !ToClaimAccountName.Empty
        and ToClaimACCPolicyID != null and !ToClaimACCPolicyID.Empty
  }

  function copyValues(copyObject:ClaimCostTransferSearchResult_ACC) {
    _claimCostTransferID = copyObject.ClaimCostTransferID
    _accNumber = copyObject.ACCNumber
    _policyNumber = copyObject.PolicyNumber
    _fromClaim = copyObject.FromClaim
    _toClaim = copyObject.ToClaim
    _startDate = copyObject.StartDate
    _endDate = copyObject.EndDate
    _description = copyObject.Description
    _createDate = copyObject.CreateDate
    _createdBy = copyObject.CreatedBy
    _modifiedDate = copyObject.ModifiedDate
    _modifiedBy = copyObject.ModifiedBy
    _fromClaimACCNumber = copyObject.FromClaimACCNumber
    _fromClaimAccountName = copyObject.FromClaimAccountName
    _fromClaimACCPolicyID = copyObject.FromClaimACCPolicyID
    _toClaimACCNumber = copyObject.ToClaimACCNumber
    _toClaimAccountName = copyObject.ToClaimAccountName
    _toClaimACCPolicyID = copyObject.ToClaimACCPolicyID
  }
}