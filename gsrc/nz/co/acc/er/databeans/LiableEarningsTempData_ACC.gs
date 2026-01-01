package nz.co.acc.er.databeans


uses java.io.Serializable
uses java.math.BigDecimal

/**
 * Created by andy on 25/09/2017.
 */
class LiableEarningsTempData_ACC implements Serializable {

  var _cuCode : String as CuCode
  var _cuDesc : String as CuDesc
  var _year : int as Year
  var _totalLiableEarnings: BigDecimal as TotalLiableEarnings
  var _totalLevyDue : BigDecimal as TotalLevyDue


  construct() {
  }

}