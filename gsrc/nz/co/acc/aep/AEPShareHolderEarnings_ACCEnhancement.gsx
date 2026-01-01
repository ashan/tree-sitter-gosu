package nz.co.acc.aep

uses gw.api.financials.CurrencyAmount

/**
 * Return Relevant Liable Earnings for Shareholder Earnings
 */
enhancement AEPShareHolderEarnings_ACCEnhancement: ShareholderEarnings_ACC {
  property get RelevantAdjustedLELessCpxForAEP() : CurrencyAmount {
    if (this.Branch.Job typeis Audit)
      return this.AuditAdjustedLELessCpx?.toCurrencyAmount()
    else
      return this.AdjustedLELessCpx?.toCurrencyAmount()
  }

  property get RelevantAdjustedLEForAEP() : CurrencyAmount {
    if (this.Branch.Job typeis Audit)
      return this.LiableEarnings?.toCurrencyAmount()
    else
      return this.AdjustedLiableEarnings?.toCurrencyAmount()
  }
}
