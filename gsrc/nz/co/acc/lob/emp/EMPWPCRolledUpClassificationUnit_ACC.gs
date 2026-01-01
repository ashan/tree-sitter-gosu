package nz.co.acc.lob.emp

uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal

/**
 * Hold the rolled up CU data.
 */
class EMPWPCRolledUpClassificationUnit_ACC {
  var _cuCode : String as CUCode
  var _cuDescription : String as CUDescription
  var _percentage : BigDecimal as Percentage
  var _adjustedLiableEarnings : MonetaryAmount as AdjustedLiableEarnings

}