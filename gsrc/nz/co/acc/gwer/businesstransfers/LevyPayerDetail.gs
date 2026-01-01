package nz.co.acc.gwer.businesstransfers

class LevyPayerDetail {

  private var _accPolicyID : String as ACCPolicyID
  private var _levyPayerName : String as LevyPayerName

  construct(accPolicyID : String, levyPayerName : String) {
    _accPolicyID = accPolicyID
    _levyPayerName = levyPayerName
  }
}