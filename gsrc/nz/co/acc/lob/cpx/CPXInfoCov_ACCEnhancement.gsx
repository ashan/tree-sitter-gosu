package nz.co.acc.lob.cpx

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses typekey.*

uses java.math.BigDecimal

/**
 * Enhancement class for CPX Info Cov
 */
enhancement CPXInfoCov_ACCEnhancement: CPXInfoCov_ACC {

  function adjustMaxCoverPermitted() {
    this.MaxCoverPermitted = INDCPXCovUtil_ACC.adjustAmountWithCPXMinMax(this.MaxCoverPermitted ?: new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD),
                                                                         this.INDCPXCov.INDCPXLine.EffectiveDate)
  }

  function adjustAgreedCover() {
    this.AgreedLevelOfCover = INDCPXCovUtil_ACC.adjustAmountWithCPXMinMax(this.AgreedLevelOfCover, this.INDCPXCov.INDCPXLine.EffectiveDate)
  }

  property get CoverTypeLabel() : String {
    if(this.CoverTypeStandard != null) {
      return this.CoverTypeStandard ? DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.CoverType.Standard") : DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.CoverType.LLWC")
    }
    return null
  }

  property get IsCPXPeriodDatesSet() : boolean {
    if(this.PeriodStart == null or this.PeriodEnd == null) {
      throw new DisplayableException(DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.CPXPeriodEndNotSet"))
    }

    return true
  }

  function HasAgreedLevelOfCoverChanged() : boolean {
    return (this.isFieldChangedFromBasedOn("AgreedLevelOfCover") or
            (this.BasedOn.AgreedLevelOfCover == null and this.AgreedLevelOfCover != null))
  }

  function HasMaxCoverPermittedChanged() : boolean {
    return this.isFieldChangedFromBasedOn("MaxCoverPermitted") or
           (this.BasedOn.MaxCoverPermitted == null and this.MaxCoverPermitted != null)
  }

  property get HasPeriodEndChanged() : boolean {
    return this.isFieldChangedFromBasedOn("PeriodEnd")
  }

  function needsAlcApproval() : Boolean {
    if (this.AgreedLevelOfCover <= this.MaxCoverPermitted) {
      return false
    }

    if (this.BasedOn == null) {
      return true;
    }

    if (!this.HasAgreedLevelOfCoverChanged() and !this.HasMaxCoverPermittedChanged()) {
      return false
    }
    return true
  }

  function HasALCOrMCPChanged() : boolean {
    if (this.HasAgreedLevelOfCoverChanged() or this.HasMaxCoverPermittedChanged()) {
      return true
    }
    return false
  }

  function validateCPXStartDate(value:Date) : String {
    if(value.before(this.Branch.PeriodStart.trimToMidnight())) {
      return DisplayKey.get("Web.Policy.CPX.INDCPXCov.EffectiveStartDateValidation", this.Branch.PeriodStart.ShortFormat)
    }
    return null
  }

  function validateCPXEndDate(value:Date) : String {
    if(value.after(this.Branch.PeriodEnd.trimToMidnight())) {
      return DisplayKey.get("Web.Policy.CPX.INDCPXCov.EffectiveEndDateAfterValidation", this.Branch.PeriodEnd.ShortFormat)
    } else if (value.before(this.PeriodStart.trimToMidnight())) {
      return DisplayKey.get("Web.Policy.CPX.INDCPXCov.EffectiveEndDateBeforeValidation", this.PeriodStart.ShortFormat)
    }
    return null
  }
}
