package nz.co.acc.lob.common

uses gw.api.financials.CurrencyAmount
uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Utility class.
 */
class BusinessClassificationUtil_ACC {

  /**
   * This method allocates the adjusted liable earnings to the business classifications based on the percentages.
   * @param adjustedLiableEarnings
   * @param businessClassifications
   */
  public static function allocateAdjustedLiableEarnings(adjustedLiableEarnings : MonetaryAmount, businessClassifications: PolicyLineBusinessClassificationUnit_ACC[]) {
    if (adjustedLiableEarnings != null and businessClassifications != null) {
      for (busClass in businessClassifications) {
        // Set the input to scale = 2, half round up
        var adjustedLiableEarningsAmt = adjustedLiableEarnings.Amount.setScale(2, RoundingMode.HALF_UP)
        // set to zero if it is null
        if (busClass.Percentage == null) {
          busClass.Percentage = BigDecimal.ZERO
        }
        var percent = busClass.Percentage.setScale(2, RoundingMode.HALF_UP)
        var allocation = adjustedLiableEarningsAmt * (percent / 100)
        allocation = allocation.setScale(2, RoundingMode.HALF_UP)
        busClass.AdjustedLiableEarnings = new CurrencyAmount(allocation, Currency.TC_NZD)
      }
    }
  }


  public static function hasClassificationUnit(policyPeriod:PolicyPeriod) : boolean {
    var result = false

    if(policyPeriod.CWPSLineExists) {
      return hasClassificationUnit(policyPeriod.CWPSLine)
    } else if(policyPeriod.EMPWPCLineExists) {
      return hasClassificationUnit(policyPeriod.EMPWPCLine)
    } else {
      result = hasClassificationUnit(policyPeriod.INDCoPLine)
      if(policyPeriod.INDCPXLineExists) {
        return hasClassificationUnit(policyPeriod.INDCPXLine)
      }
    }
    return result
  }

  public static function hasClassificationUnit(policyLine:PolicyLine) : boolean {
    return policyLine.BICCodes.length > 0 ? false : true
  }
}