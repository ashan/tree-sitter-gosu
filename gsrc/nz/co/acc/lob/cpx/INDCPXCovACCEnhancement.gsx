package nz.co.acc.lob.cpx

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses gw.util.Pair
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

uses java.math.BigDecimal

/**
 * Created by ManubaF on 26/05/2017.
 */
enhancement INDCPXCovACCEnhancement: INDCPXCov {
  function canCreateNewPeriod(startDate : Date, endDate : Date) : boolean {
    var result = DateUtil_ACC.isBeforeOrOnSameDay(this.Branch.PeriodStart, startDate) and DateUtil_ACC.isAfterDay(this.Branch.PeriodEnd, startDate) and
                 DateUtil_ACC.isBeforeOrOnSameDay(this.Branch.PeriodStart, endDate) and DateUtil_ACC.isAfterOrOnSameDay(this.Branch.PeriodEnd, endDate) and
                 !this.CPXInfoCovs.hasMatch(\elt1 -> validateDateRanges(new Pair<Date,Date>(startDate, endDate), new Pair<Date, Date>(elt1.PeriodStart, elt1.PeriodEnd)))

    return result
  }

  protected function validateDateRanges(date1 : Pair<Date,Date>, date2: Pair<Date,Date>) : boolean {
    if(DateUtil_ACC.isBeforeOrOnSameDay(date1.First, date2.Second) and
       DateUtil_ACC.isAfterOrOnSameDay(date1.Second, date2.First)) {
      return true
    }
    return false
  }

  function createCPXInfoCov(newEffectiveDate : Date, newExpirationDate : Date): CPXInfoCov_ACC {

    var newCPXEarning : CPXInfoCov_ACC = null
    var coverage = this.INDCPXLine.INDCPXCovs.first()
    if(coverage.canAddNewPeriod(newEffectiveDate)) {
      newCPXEarning = new CPXInfoCov_ACC(this.Branch)

      var cpxEarnings = this.INDCPXLine.INDCPXCovs.first().CPXInfoCovs
      if(cpxEarnings.length > 0) {
        newCPXEarning = cpxEarnings[0].shallowCopy() as CPXInfoCov_ACC
      }

      newCPXEarning.PeriodStart = newEffectiveDate ?: getNextAvailableDate()
      newCPXEarning.PeriodEnd = newExpirationDate ?: this.INDCPXLine.ExpirationDate

      this.addToCPXInfoCovs(newCPXEarning)
    } else {
      throw new DisplayableException(DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.CannotAddCPXPeriod"))
    }

    return newCPXEarning
  }

  function getNextAvailableDate() : Date {
    var nextDate : Date = null
    var earnings = this.INDCPXLine.INDCPXCovs.first().CPXInfoCovs

    if(earnings.length > 0 and earnings[0].IsCPXPeriodDatesSet) {
      nextDate = earnings[0].PeriodEnd
      for (cpxEarning in earnings) {
        if(cpxEarning.IsCPXPeriodDatesSet and nextDate.getTime() < cpxEarning.PeriodEnd.getTime()) {
            nextDate = cpxEarning.PeriodEnd
        }
      }
      nextDate = nextDate.addDays(1)
    } else {
      nextDate = this.INDCPXLine.EffectiveDate
    }

    return nextDate
  }

  function removeCPXInfoCov(cbl: CPXInfoCov_ACC) {
    this.removeFromCPXInfoCovs(cbl)
  }

  function canAddNewPeriod(nextDate:Date) : boolean {
    var nextAvailableDate = nextDate ?: this.getNextAvailableDate()
    if (nextAvailableDate != null) {
      if(DateUtil_ACC.isAfterDay(nextAvailableDate, this.INDCPXLine.ExpirationDate) or
          DateUtil_ACC.isSameDay(nextAvailableDate, this.INDCPXLine.ExpirationDate)) {
        return false
      }
    }

    return true
  }

  function getOptionalALCForApproval() : Optional<CPXInfoCov_ACC> {
    return Optional.ofNullable(this.CPXInfoCovs.firstWhere(\elt -> elt.needsAlcApproval()))
  }

  function getALCForApproval() : MonetaryAmount {
    var optionALC = getOptionalALCForApproval()
    return optionALC.Present ? optionALC.get().AgreedLevelOfCover : null
  }

  function getOptionalChangedALC() : Optional<CPXInfoCov_ACC> {
    return Optional.ofNullable(this.CPXInfoCovs.firstWhere(\elt -> elt.HasAgreedLevelOfCoverChanged()))
  }

  function getChangedALC() : MonetaryAmount {
    var optionalALC = getOptionalChangedALC()
    return optionalALC.Present ? optionalALC.get().AgreedLevelOfCover : null
  }

  function getOptionalChangedMCP() : Optional<CPXInfoCov_ACC> {
    return Optional.ofNullable(this.CPXInfoCovs.firstWhere(\elt -> elt.HasMaxCoverPermittedChanged()))
  }

  function getChangedMCP() : MonetaryAmount {
    var optionalMCP = getOptionalChangedMCP()
    return optionalMCP.Present ? optionalMCP.get().MaxCoverPermitted : null
  }

  function hasALCOrMCPChanged() : Boolean  {
    return this.CPXInfoCovs.hasMatch(\elt -> elt.HasALCOrMCPChanged())
  }
}
