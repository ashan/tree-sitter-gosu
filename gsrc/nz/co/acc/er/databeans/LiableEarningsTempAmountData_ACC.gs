package nz.co.acc.er.databeans


uses java.io.Serializable
uses java.math.BigDecimal

/**
 * Created by andy on 25/09/2017.
 */
class LiableEarningsTempAmountData_ACC implements Serializable {

  var _cuCode : String as CUCode
  var _accPolicyID : String as ACCPolicyID
  var _amounts : LiableEarningsAmountsData_ACC as Amounts

  construct() {
    _amounts = new LiableEarningsAmountsData_ACC()
  }

}