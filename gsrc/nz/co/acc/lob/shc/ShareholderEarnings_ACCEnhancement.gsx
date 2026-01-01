package nz.co.acc.lob.shc

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.cpx.CPXSheAdjLEAssessment_ACC
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by ManubaF on 27/03/2017.
 */
enhancement ShareholderEarnings_ACCEnhancement : ShareholderEarnings_ACC {
  function computeExcessMax() : MonetaryAmount {
    var minMax = LiableEarningsUtilities_ACC.findFinalMaxWPSValue(this.EffectiveDate, this.Branch.CWPSLine.JobType == TC_AUDIT)

    if (minMax != null) {
      if (this.Remuneration.Amount > minMax) {
        this.ExcessMax = this.Remuneration - new MonetaryAmount(minMax, Currency.TC_NZD)
      } else {
        this.ExcessMax = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
      }
    } else {
      throw new DisplayableException(DisplayKey.get("Web.WorkPlaceCover_ACC.Coverage.LiableEarnings.MinMaxEarningsNotFound", DateUtil_ACC.createDateAsString(this.EffectiveDate)))
    }

    return this.ExcessMax
  }

  function onFirstWeekUpdate() {
    if (this.FirstWeek == null) {
      this.FirstWeek = new MonetaryAmount(0, Currency.TC_NZD)
    }
    computeShareholderEarnings()
  }

  function computeIndividualLiableEarnings() : MonetaryAmount {
    if (this.Branch.CWPSLine.JobType == TC_AUDIT) {
      this.LiableEarnings = this.Remuneration - this.ExcessMax - this.FirstWeek
    } else {
      this.LiableEarnings = this.Remuneration - this.ExcessMax
    }
    return this.LiableEarnings
  }

  function computeAdjustedLiableEarnings() : MonetaryAmount {
    if (this.Branch.CWPSLine.CWPSCovs.first().ApplyInflation) {
      var lciRate = LiableEarningsUtilities_ACC.findInflationAdjustmentPercent(this.EffectiveDate)
      if (lciRate == null) {
        throw new DisplayableException(DisplayKey.get("Web.WorkPlaceCover_ACC.Coverage.LiableEarnings.InflationAdjustmentNotFound", DateUtil_ACC.createDateAsString(this.EffectiveDate)))
      } else {
        this.AdjustedLiableEarnings = (this.LiableEarnings * (1 + lciRate / 100)).setScale(2, RoundingMode.HALF_UP)
      }
    } else {
      this.AdjustedLiableEarnings = this.LiableEarnings
    }
    return this.AdjustedLiableEarnings
  }


  function recalculateLiableEarningsForShareholder_ACC() {
    var policyPeriod = this.Branch.AssociatedPolicyPeriod
    var shareholder = this.ShareholderID
    var totalCPXAdjustment = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
    var totalCPXAdjustmentAudit = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
    var adjustedLiableEarnings = this.AdjustedLiableEarnings
    var liableEarnings = this.LiableEarnings

    this.ShareholderID.PolicySHECPXDetails.each(\policySHECPXDetails -> {
      CPXSheAdjLEAssessment_ACC.assessCPXAdjustedLiableEarnings_ACC(policySHECPXDetails, policyPeriod, shareholder)
      totalCPXAdjustment = totalCPXAdjustment.add(policySHECPXDetails.shareAdjLE)
      totalCPXAdjustmentAudit = totalCPXAdjustmentAudit.add(policySHECPXDetails.shareAuditAdjLE)
    })

    var adjustedLiableEarningsLessCPX = adjustedLiableEarnings.subtract(totalCPXAdjustment)
    var liableEarningsLessCPX = liableEarnings.subtract(totalCPXAdjustmentAudit)

    this.AdjustedLELessCpx = adjustedLiableEarningsLessCPX
    this.AuditAdjustedLELessCpx = liableEarningsLessCPX
  }

  function validateFirstWeek_ACC() {
    var firstWeek = this.FirstWeek_amt
    var remuneration = this.Remuneration_amt

    var minMax = LiableEarningsUtilities_ACC.findFinalMaxWPSValue(this.EffectiveDate, this.Branch.CWPSLine.JobType == TC_AUDIT)
    // First week cannot be < 0
    if (firstWeek < 0) {
      throw new DisplayableException(DisplayKey.get("Web.Policy.CWPS.Audit.FirstWeekNegative"))
    }
    // First week cannot be > remuneration
    if (firstWeek > remuneration) {
      throw new DisplayableException(DisplayKey.get("Web.Policy.CWPS.Audit.FirstWeekGreaterThanRemuneration"))
    }

    // First week cannot be > remuneration
    if (firstWeek > minMax) {
      throw new DisplayableException(DisplayKey.get("Web.Policy.CWPS.FirstWeekGreaterThanMinMax"))
    }
  }

  function computeShareholderEarnings() {
    if (this.ShareholderID.PolicyContactType == ContactType.TC_PERSON) {
      if (this.Remuneration.Amount > 0) {
        computeExcessMax()
        computeIndividualLiableEarnings()
        computeAdjustedLiableEarnings()
        recalculateLiableEarningsForShareholder_ACC()
        validateFirstWeek_ACC()
      } else {
        this.Remuneration = new MonetaryAmount(0, Currency.TC_NZD)
        this.ExcessMax = new MonetaryAmount(0, Currency.TC_NZD)
        this.FirstWeek = new MonetaryAmount(0, Currency.TC_NZD)
        this.LiableEarnings = new MonetaryAmount(0, Currency.TC_NZD)
        this.AdjustedLiableEarnings = new MonetaryAmount(0, Currency.TC_NZD)
        this.AdjustedLELessCpx = new MonetaryAmount(0, Currency.TC_NZD)
        this.AuditAdjustedLELessCpx = new MonetaryAmount(0, Currency.TC_NZD)
      }
    }
    if (this.ShareholderID.PolicyContactType == ContactType.TC_COMPANY) {
      if (this.Remuneration == null) {
        this.Remuneration = new MonetaryAmount(0, Currency.TC_NZD)
      }
      this.ExcessMax = new MonetaryAmount(0, Currency.TC_NZD)
      this.FirstWeek = new MonetaryAmount(0, Currency.TC_NZD)
      this.LiableEarnings = new MonetaryAmount(0, Currency.TC_NZD)
      this.AdjustedLiableEarnings = new MonetaryAmount(0, Currency.TC_NZD)
      this.AdjustedLELessCpx = new MonetaryAmount(0, Currency.TC_NZD)
      this.AuditAdjustedLELessCpx = new MonetaryAmount(0, Currency.TC_NZD)
    }

    if (this.Branch.Policy.Account.PreventReassessment_ACC) {
      this.AdjustedLiableEarnings = new MonetaryAmount(0, Currency.TC_NZD)
      this.AdjustedLELessCpx = new MonetaryAmount(0, Currency.TC_NZD)
    }
  }

  function initializeFields() {
    this.AdjustedLELessCpx = new MonetaryAmount(0, Currency.TC_NZD)
    this.AuditAdjustedLELessCpx = new MonetaryAmount(0, Currency.TC_NZD)
    this.AdjustedLiableEarnings = new MonetaryAmount(0, Currency.TC_NZD)
    this.LiableEarnings = new MonetaryAmount(0, Currency.TC_NZD)
    this.ExcessMax = new MonetaryAmount(0, Currency.TC_NZD)
    this.PostWeek = new MonetaryAmount(0, Currency.TC_NZD)
    this.FirstWeek = new MonetaryAmount(0, Currency.TC_NZD)
    this.Remuneration = new MonetaryAmount(0, Currency.TC_NZD)
    this.CUCode = new String()
  }

  property get ACCNumber() : String {
    var accNumber = this.ShareholderID.PolicyContact.ACCID_ACC
    if (!accNumber.HasContent) {
      accNumber = this.ShareholderID?.PolicyContact?.AccountContacts?.firstWhere(\elt -> elt.Account.AccountHolderContact.ACCID_ACC == this.ShareholderID.ContactDenorm.ACCID_ACC)?.Account.ACCID_ACC
      if (!accNumber.HasContent) {
        accNumber = ""
      }
    }

    return accNumber
  }
}
