package nz.co.acc.lob.cpx

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses gw.util.Pair
uses nz.co.acc.lob.common.DateUtil_ACC
uses typekey.*

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * A utility class for CPX.
 */
class INDCPXCovUtil_ACC {

  public static final var accLevyYearStartDay : int = (ScriptParameters.getParameterValue("ACCLevyYearStartDay") as BigDecimal).intValue()
  public static final var accLevyYearStartMonth : int = (ScriptParameters.getParameterValue("ACCLevyYearStartMonth") as BigDecimal).intValue()

  /**
   * For a given set of PolicyPeriods, that the product code is 'ShareholdingCompany',
   * sum up all the Remuneration for the given contact
   * @param policyPeriods the PolicyPeriods
   * @param contact The contact to match for the earnings total
   * @return
   */
  public static function sumOfWPSShareholderEarningsForContact(policyPeriods : List<PolicyPeriod>, contact : Contact) : MonetaryAmount{
    var sumOfearnings : MonetaryAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)

    //Find all associated bound policy periods where the product code is ShareholdingCompany
    var shareholderPolicyPeriods = policyPeriods.where(\elt ->
        elt.Policy.ProductCode == "ShareholdingCompany")

    //total up the LiableEarnings for same contact in the policy shareholders - there can only be one in each policy
    //note that LiableEarnings takes into account the CPX max
    shareholderPolicyPeriods.each(\shePolicyPeriod -> {
      var shareHolder = shePolicyPeriod.getSlice(shePolicyPeriod.PeriodStart).CWPSLine.PolicyShareholders?.where(\elt ->
          elt.PolicyContact == contact).first()
      if (shareHolder != null) {
        sumOfearnings = sumOfearnings.add(shareHolder.sumRemuneration())
      }
    })

    return sumOfearnings.setScale(2, RoundingMode.HALF_UP)
  }

  /**
   * Helper function to get Liable earnings for a given policy period
   * @param currentPeriod - the policy period
   * @return
   */
  public static function getINDCoPCovTotalLiableEarnings(currentPeriod : PolicyPeriod, nextYearsPeriod:PolicyPeriod) : MonetaryAmount {
    var periodToGetEarnings = currentPeriod
    if(currentPeriod.LevyYear_ACC >= ScriptParameters.SelfEmployedNewLEStartYear_ACC) {
      var ppSlice = currentPeriod?.getSlice(currentPeriod.PeriodEnd.addDays(-1))
      var adjustedLiableEarnings = ppSlice != null ? ppSlice.INDCoPLine?.INDCoPCovs?.last()?.ActualLiableEarningsCov?.TotalLiableEarnings : BigDecimal.ZERO.ofDefaultCurrency()
      return adjustedLiableEarnings?.setScale(2, RoundingMode.HALF_UP)
    }
    else if(currentPeriod.LevyYear_ACC == ScriptParameters.SelfEmployedNewLEStartYear_ACC - 1) {
      periodToGetEarnings = nextYearsPeriod
    }

    var ppSlice = periodToGetEarnings?.getSlice(periodToGetEarnings.PeriodEnd.addDays(-1))
    var adjustedLiableEarnings = ppSlice != null ? ppSlice.INDCoPLine?.INDCoPCovs?.last()?.LiableEarningCov?.TotalLiableEarnings : BigDecimal.ZERO.ofDefaultCurrency()
    return adjustedLiableEarnings?.setScale(2, RoundingMode.HALF_UP)
  }

  /**
   * Find Min and Max CPX Values
   * @param policyEffectiveDate
   * @return
   */
  public static function findMinMaxCPXValues(policyEffectiveDate : Date) : Pair<BigDecimal, BigDecimal> {
    // Date level comparison is needed
    var timelessDate = DateUtil_ACC.removeTime(policyEffectiveDate)
    var query = Query.make(EarningsMinMaxData_ACC).compare(EarningsMinMaxData_ACC#PolicyStartDate, Relop.LessThanOrEquals, timelessDate)
        .compare(EarningsMinMaxData_ACC#PolicyEndDate, Relop.GreaterThanOrEquals, timelessDate)
    var earningsMinMax = query.select().AtMostOneRow
    return new Pair<BigDecimal, BigDecimal>(earningsMinMax.FullTimeMinimumCPX_amt, earningsMinMax.FullTimeMaximumCPX_amt)
  }


  /**
   * Validate the level of cover w.r.t. the Min & Max Earning range for current year
   * @param effectiveDate
   * @param levelOfCover
   */
  public static function validateLevelOfCover(effectiveDate: Date, levelOfCover: MonetaryAmount, preventReassessment_ACC : boolean) : String {
    var validationMessage : String = null

    //Lookup Min and Max CPX values for the year
    var earningsMinMax = findMinMaxCPXValues(effectiveDate)
    var minCPX = earningsMinMax?.getFirst()
    var maxCPX = earningsMinMax?.getSecond()

    // We have a problem if Min/Max earnings are not found in database
    if (minCPX == null or maxCPX == null) {
      throw new DisplayableException(DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.MinMaxEarningsNotFound", effectiveDate.ShortFormat))
    }

    // We have a problem if the amount is not within the min and max CPX range for the effective year
    // DE447 - do not validate for Prevent Reassessment accounts
    if ((levelOfCover.Amount < minCPX or levelOfCover.Amount > maxCPX) and !preventReassessment_ACC) {
        validationMessage = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings.Validation.NotInRange", minCPX, maxCPX)
    }
    return validationMessage
  }

  /**
   * Adjust nominated coverages w.r.t. the CPX Min & Max Earning range for current year
   * Purpose was to get through the auto renewals without any issues related to CPX Min Max limits
   * @param effectiveDate
   * @param levelOfCover
   */
  public static function adjustNominatedCoverages(cpxCovInfo : CPXInfoCov_ACC, effectiveDate: Date) {
    // Bump or cap the cover amounts w.r.t. min and max CPX limits for the year
    cpxCovInfo.RequestedLevelOfCover = adjustAmountWithCPXMinMax(cpxCovInfo.RequestedLevelOfCover, effectiveDate)
    cpxCovInfo.AgreedLevelOfCover = adjustAmountWithCPXMinMax(cpxCovInfo.AgreedLevelOfCover, effectiveDate)
    cpxCovInfo.MaxCoverPermitted = adjustAmountWithCPXMinMax(cpxCovInfo.MaxCoverPermitted, effectiveDate)
  }

  /**
   * Adjust a given amount w.r.t. the CPX Min & Max Earning range for the year
   * - Bump the cover amounts to bare minimum CPX limit for the year if they are less than that
   * - Cap the cover amounts to maximum CPX limit for the year if they are above than that
   *
   * @param amount
   * @param date
   * @return
   */
  public static function adjustAmountWithCPXMinMax(amount: MonetaryAmount, date: Date) : MonetaryAmount {
    //Lookup Min and Max CPX values for the year
    var earningsCPXMinMax = findMinMaxCPXValues(date)
    var minCPX = earningsCPXMinMax?.getFirst()
    var maxCPX = earningsCPXMinMax?.getSecond()
    if (minCPX == null or maxCPX == null) {
      throw new DisplayableException(DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.MinMaxEarningsNotFound", date.ShortFormat))
    }
    if(amount?.compareTo(minCPX?.ofDefaultCurrency()) == -1) {
      // Bump the cover amounts to bare minimum CPX limit for the year if they are less than that
      return minCPX?.ofDefaultCurrency().setScale(2)
    } else if (amount?.compareTo(maxCPX?.ofDefaultCurrency()) == 1) {
      // Cap the cover amounts to maximum CPX limit for the year if they are above than that
      return maxCPX?.ofDefaultCurrency().setScale(2)
    } else {
      return amount.setScale(2)
    }
  }

  /**
   * Adjust a given amount w.r.t. the CPX Max Earning range for the year
   * - Cap the cover amounts to maximum CPX limit for the year if they are above than that
   *
   * @param amountToCap
   * @param effectiveDate
   * @return the Capped Maximum
   */
  public static function adjustAmountWithCPXMax(amountToCap: MonetaryAmount, effectiveDate: Date) : MonetaryAmount {
    //Lookup Min and Max CPX values for the year
    var earningsCPXMinMax = findMinMaxCPXValues(effectiveDate)
    var maxCPX = earningsCPXMinMax?.getSecond()

    if (amountToCap?.compareTo(maxCPX?.ofDefaultCurrency()) >= 1) {
      // Cap the cover amounts to maximum CPX limit for the year if they are above than that
      return maxCPX?.ofDefaultCurrency()
    } else {
      return amountToCap
    }
  }
  /**
   * Utility function code borrowed from US2521 where the actual date adjustment requirements are defined
   * Aligns the effective and expiration date(s), from a CPX policy, which are going to be added on WPS policies > Shareholders
   * @param cpxDates
   * @param wpsStart
   * @param wpsEnds
   * @return CPX period start and end date(s) aligned w.r.t. WPS policy start and end dates
   */
  public static function adjustCPXDatesForWPS(cpxDates: List<Pair<Date, Date>>, wpsDates: Pair<Date, Date>): List <Pair <Date, Date>> {

    var returnDates = new ArrayList <Pair <Date, Date>>()

    var wpsStart = wpsDates.First
    var wpsEnd = wpsDates.Second

    for (cpxDatePair in cpxDates) {
      var startDate : Date
      var endDate : Date

      var cpxStart = cpxDatePair.First
      var cpxEnd = cpxDatePair.Second

      // if the WPS end is before the CPX end, the CPX end date for the WPS shareholder's CPX details is the CPX end Date
      // else its the WPS end date
      if (wpsEnd.before(cpxEnd)) {
        endDate = wpsEnd
      } else {
        endDate = cpxEnd
      }
      if (wpsStart.after(cpxStart)) {
        startDate = wpsStart
      } else {
        startDate = cpxStart
      }
      // if the WPS end is before the CPX end, the CPX end date for the WPS shareholder's CPX details is the CPX end Date
      // else its the WPS end date
      if (wpsEnd.before(cpxEnd)) {
        endDate = wpsEnd
      } else {
        endDate = cpxEnd
      }

      returnDates.add (new Pair(startDate, endDate))
    }
    return returnDates
  }
}
