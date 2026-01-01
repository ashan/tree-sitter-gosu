package edge.capabilities.quote.quoting.util

uses java.lang.UnsupportedOperationException
uses edge.capabilities.quote.quoting.dto.QuoteDTO
uses gw.api.util.CurrencyUtil
uses edge.util.helper.CurrencyOpUtil
uses edge.capabilities.currency.dto.AmountDTO
uses gw.api.util.DateUtil
uses java.util.Date
uses java.util.GregorianCalendar
uses java.util.Calendar

/**
 * Utilities for the quoting process.
 */
class QuoteUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }

    /**
     * Returns a base policy period for the submission, coverables are set on this branch and the other branches are
      * generated from here
     */
    public static function getBasePeriod(sub : Submission) : PolicyPeriod {

      var period = sub.ActivePeriods.firstWhere(\ p -> {
        var basePeriodName = "CUSTOM"
        if(p.Offering == null) {
          //use custom branch for periods were coverage options are set via offerings
          basePeriodName = "BASE"
        }
        return p.BranchName == basePeriodName
      })
      // If no matching period, defaults to the selected branch
      return period == null ? sub.SelectedVersion : period
    }

    /**
     * Returns a the policy period used for the custom quote option
     */
    public static function getCustomPeriod(sub : Submission) : PolicyPeriod {

      var period = sub.ActivePeriods.firstWhere(\ p -> p.BranchName == "CUSTOM")
      // If no matching period, defaults to the selected branch
      return period == null ? sub.SelectedVersion : period
    }

  /**
   * Fills base properties on the quote DTO.
   */
  public static function fillBaseProperties(dto : QuoteDTO, pp : PolicyPeriod) {
    dto.BranchName = pp.BranchName
    dto.PublicID = pp.PublicID
    if(pp.Offering == null) {
      dto.BranchCode = dto.BranchName
    } else {
      dto.BranchCode = pp.Offering.CodeIdentifier
    }
    dto.IsCustom = pp.Offering == null
    dto.PeriodStartDate = pp.PeriodStart
    dto.PeriodEndDate = pp.PeriodEnd
    dto.QuoteID = pp.Submission.getJobNumber()
    var startToEndMonths = monthsBetweenPeriodStartAndEnd(pp.PeriodStart, pp.PeriodEnd)
    dto.TermMonths = startToEndMonths
    if(pp.TotalCostRPT != null) {
      dto.Total = AmountDTO.fromMonetaryAmount(pp.TotalCostRPT)
      dto.Taxes = AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sum(pp.AllCosts.TaxSurcharges))
      dto.TotalBeforeTaxes = AmountDTO.fromMonetaryAmount(pp.TotalPremiumRPT)
      dto.MonthlyPremium =  AmountDTO.fromMonetaryAmount(pp.TotalCostRPT / dto.TermMonths)
    }
  }

  private static function monthsBetweenPeriodStartAndEnd(start: Date, end: Date) : int{
    var startCalendar = new GregorianCalendar();
    startCalendar.setTime(start);
    var endCalendar = new GregorianCalendar();
    endCalendar.setTime(end);

    var diffYear = endCalendar.get(Calendar.YEAR) - startCalendar.get(Calendar.YEAR)
    return diffYear * 12 + endCalendar.get(Calendar.MONTH) - startCalendar.get(Calendar.MONTH)
  }
}
