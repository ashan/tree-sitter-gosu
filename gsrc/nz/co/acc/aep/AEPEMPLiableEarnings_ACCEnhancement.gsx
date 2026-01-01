package nz.co.acc.aep

uses gw.api.financials.CurrencyAmount

/**
 * Created by madhav.mandayam on 06-Jul-17.
 */
enhancement AEPEMPLiableEarnings_ACCEnhancement: EMPLiableEarnings_ACC {
  property get RelevantAdjustedLEForAEP() : CurrencyAmount {
    if (this.Branch.Job typeis Audit)
      return this.TotalLiableEarnings?.toCurrencyAmount()
    else
      return this.AdjustedLiableEarnings?.toCurrencyAmount()
  }
}
