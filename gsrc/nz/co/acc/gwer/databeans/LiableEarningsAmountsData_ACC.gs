package nz.co.acc.gwer.databeans


uses java.io.Serializable
uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by andy on 25/09/2017.
 */
class LiableEarningsAmountsData_ACC implements Serializable {

  var _transferPolicyID : int as TransferPolicyID
  var _year : int as Year
  var _levyDueAmount : BigDecimal as LevyDueAmount = new BigDecimal(0).setScale(2, RoundingMode.CEILING)
  var _liableEarningsAmount : BigDecimal as LiableEarningsAmount = new BigDecimal(0).setScale(2, RoundingMode.CEILING)

  construct() {
  }

}