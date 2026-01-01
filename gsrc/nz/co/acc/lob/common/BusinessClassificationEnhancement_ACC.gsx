package nz.co.acc.lob.common

uses gw.api.financials.CurrencyAmount
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.shc.util.CWPSUIUtil_ACC

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by ManubaF on 16/03/2017.
 */
enhancement BusinessClassificationEnhancement_ACC: PolicyLineBusinessClassificationUnit_ACC {
  function isPrimary() : boolean {
    if(this.PolicyLineRef.PrimaryBICCode_ACC == this and
       this.CUCode != null) {
      return true
    }
    return false
  }

  function setAsPrimary() {
    if (this.CUCode != null) {
      // For WPS set the shareholder CU's to the new primary CU for ones that have the old primary CU
      if (this.PolicyLineRef typeis entity.CWPSLine) {
        CWPSUIUtil_ACC.updateCWPSShareholderClassificationUnits(this, this.PolicyLineRef)
      }
      this.PolicyLineRef.PrimaryBICCode_ACC = this
    }
    else {
      throw new DisplayableException(DisplayKey.get("Web.Policy.CWPS.InvalidBICForPrimary_ACC"))
    }
  }

  function calculateAdjustedLiableEarnings() {
    // allocate adjusted liable earnings across the bic's
    var isAudit = this.PolicyLineRef.getAssociatedPolicyPeriod().Job typeis Audit
    if (this.PolicyLineRef typeis entity.EMPWPCLine) {
      var liableEarnings = this.PolicyLineRef.EMPWPCCovs.first().getLiableEarnings()
      var adjustedLiableEarnings: MonetaryAmount
      // set to zero if it is null
      if (this.Percentage == null) {
        this.Percentage = BigDecimal.ZERO
      }
      if (isAudit && liableEarnings != null) {
        adjustedLiableEarnings = (liableEarnings.TotalLiableEarnings * (this.Percentage / 100)).setScale(2, RoundingMode.HALF_UP)
      } else {
        adjustedLiableEarnings = (liableEarnings.AdjustedLiableEarnings * (this.Percentage / 100)).setScale(2, RoundingMode.HALF_UP)
      }
      this.AdjustedLiableEarnings = new CurrencyAmount(adjustedLiableEarnings.Amount, Currency.TC_NZD)
    }
  }

  function clearAllFields() {
    this.BICCode = null
    this.BICDescription = null
    this.CUCode = null
    this.CUDescription = null
    this.ReplacementLabourCost = new MonetaryAmount(0, Currency.TC_NZD)
    this.Percentage = 0
    this.LiableEarnings = new CurrencyAmount(0, Currency.TC_NZD)
    this.AdjustedLiableEarnings = new CurrencyAmount(0, Currency.TC_NZD)

    if(this == this.PolicyLineRef.PrimaryBICCode_ACC) {
      this.PolicyLineRef.PrimaryBICCode_ACC = null
    }
  }
}
