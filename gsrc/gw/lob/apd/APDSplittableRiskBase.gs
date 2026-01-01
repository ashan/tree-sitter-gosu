package gw.lob.apd

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.web.util.PCDateUtil

/**
 * Contains common functionality for {@link gw.lob.apd.APDSplittableRisk} implementations.
 */
@Export
abstract class APDSplittableRiskBase implements APDSplittableRisk {
  // The base class and parent for the risk entities that implement APDSplittableRisk
  protected var _owner : EffDated

  override function addSplitDate(splitDate : Date) {
    var date = PCDateUtil.mergeDateAndTime(splitDate, PeriodStart)
    var errorMsg = canSplitOnDate(date)
    if (errorMsg != null) {
      throw new DisplayableException(errorMsg)
    }
    splitRisk(date)
  }

  override function canSplitOnDate(splitDate : Date) : String {
    var date = PCDateUtil.mergeDateAndTime(splitDate, PeriodStart)
    if (SplitDates.hasMatch(\r -> r == date)){
      return DisplayKey.get("Web.Policy.SplitByRatingPeriod.DuplicatedDate", _owner, date.ShortFormat)
    }
    if (not (_owner.BranchUntyped as PolicyPeriod).includes(date)) { // Cast as PolicyPeriod to leverage the '.includes' method. PolicyPeriod is currently the only implementation of EffDatedBranch.
      return DisplayKey.get("Web.Policy.SplitByRatingPeriod.DateOutsidePeriod", date, PeriodStart, PeriodEnd)
    }
    return null
  }

  override property get SplitDates() : List<Date> {
    var splitDates = _owner.VersionListUntyped.AllVersionsUntyped*.EffectiveDate.toList()
    splitDates.add(PeriodStart)
    splitDates.add(PeriodEnd)
    return splitDates.sort()
  }

  property get PeriodStart(): Date {
    return _owner.BranchUntyped.PeriodStart
  }

  property get PeriodEnd(): Date {
    return _owner.BranchUntyped.PeriodEnd
  }

  protected function splitRisk(date : Date) {
    _owner.splitWM(date)
  }

}