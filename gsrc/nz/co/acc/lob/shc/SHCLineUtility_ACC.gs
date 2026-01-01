package nz.co.acc.lob.shc

uses gw.api.financials.CurrencyAmount
uses productmodel.CWPSLine

@Export
class SHCLineUtility_ACC  {

  /**
   * Validate Individual Coverages.
   * @param line an Individual
   */
  static function computedTotalEarningsPerCU(line : CWPSLine) {

  }

  static function generatePolicyLineBusinessClassification(policyPeriod : PolicyPeriod) {
    var bc : PolicyLineBusinessClassificationUnit_ACC
    bc.setBICCode("123")
    bc.setCUCode("456")
    bc.setCUDescription("456 Description")
    bc.setPercentage(100)
    bc.setLiableEarnings(new CurrencyAmount(45000))
    bc.setAdjustedLiableEarnings(new CurrencyAmount(10000))
  }
}