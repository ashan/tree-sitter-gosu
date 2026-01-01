package nz.co.acc.lob.ind

uses gw.api.locale.DisplayKey
uses gw.policy.PolicyLineValidation
uses gw.validation.PCValidationContext
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

uses java.math.BigDecimal

uses productmodel.INDCoPLine

@Export
class INDLineValidation extends PolicyLineValidation<entity.INDCoPLine> {

  property get indLine() : entity.INDCoPLine {
    return Line
  }

  construct(valContext : PCValidationContext, polLine : entity.INDCoPLine) {
    super(valContext, polLine)
  }

  override function doValidate() {
    // Add line-specific validation logic here
    validateCoPLine()
    checkExpRatingModifiers()
    checkDiscountsAppliedModifiersHaveDates_ACC()
  }

  /**
   * Validate Individual Coverages.
   *
   * @param line an Individual
   */
  static function validateCoverages(line : INDCoPLine) {
    PCValidationContext.doPageLevelValidation(\context -> new INDLineValidation(context, line).validateCoPLine())
  }

  protected function validateCoPLine() {
    Line.getAssociatedPolicyPeriod().checkForLEofFollowingYear()
    checkEarnings_ACC()
    checkBICCodes_ACC()
    checkCUCodes_ACC()
  }

  /**
   * Validate  Modifiers.
   *
   * @param line an Individual
   */
  static function validateModifiers(line : INDCoPLine) {
    PCValidationContext.doPageLevelValidation(\context -> new INDLineValidation(context, line).validateModifiers())
  }

  private function validateModifiers() {
    checkDiscountsAppliedModifiersHaveDates_ACC()
  }

  /**
   * Check if the Liable Earnings are within min/max limits.
   * Check if the Liable Earnings total calculation equal the current total liable earnings.
   */
  protected function checkEarnings_ACC() {
    Context.addToVisited(this, "checkEarnings")

    if (Line.INDCoPCovs != null and Line.INDCoPCovs.length > 0) {
      var liableEarnings : INDLiableEarnings_ACC
      var isActutal = false
      if (Line.AssociatedPolicyPeriod.CeasedTrading_ACC or
          Line.AssociatedPolicyPeriod.IsNewLERuleAppliedYear) {
        liableEarnings = Line.INDCoPCovs.first().ActualLiableEarningsCov
        isActutal = true
      } else {
        liableEarnings = Line.INDCoPCovs.first().LiableEarningCov
      }

      checkLiableEarningsLimits(liableEarnings)
      checkLiableEarningReCalculation(liableEarnings, isActutal)

      if ((Line.AssociatedPolicyPeriod.CeasedTrading_ACC and Line.Branch.IsBeforePostTransitionYear) or
          Line.AssociatedPolicyPeriod.IsLETransitionYear) {
        checkLiableEarningReCalculation(Line.INDCoPCovs.first().LiableEarningCov, false)
      }
    }
  }

  private function checkLiableEarningsLimits(liableEarnings : INDLiableEarnings_ACC) {
    Context.addToVisited(this, "checkLiableEarningsLimits")

    var lowerLimit = BigDecimal.valueOf(-100000000000)
    var upperLimit = BigDecimal.valueOf(100000000000)
    checkFieldMinMaxAmount("Net Scheduler Payments", liableEarnings.NetSchedulerPayments_amt, lowerLimit, upperLimit)
    checkFieldMinMaxAmount("Total Active Partnership", liableEarnings.TotalActivePartnershipInc_amt, lowerLimit, upperLimit)
    checkFieldMinMaxAmount("Adjusted LTC Income", liableEarnings.AdjustedLTCIncome_amt, lowerLimit, upperLimit)
    checkFieldMinMaxAmount("Self Employed Net Income", liableEarnings.SelfEmployedNetIncome_amt, lowerLimit, upperLimit)
    checkFieldMinMaxAmount("Total Gross Income", liableEarnings.TotalGrossIncome_amt, lowerLimit, upperLimit)
    checkFieldMinMaxAmount("Total Shareholder Employee Salary ", liableEarnings.TotalShareholderEmplSalary_amt, lowerLimit, upperLimit)
    checkFieldMinMaxAmount("Total Income Not Liable for ACC Earners' Levy", liableEarnings.TotalIncomeNotLiable_amt, lowerLimit, upperLimit)
    checkFieldMinMaxAmount("Total Other Net Income", liableEarnings.TotalOtherNetIncome_amt, lowerLimit, upperLimit)
    checkFieldMinMaxAmount("Total Overseas Income", liableEarnings.TotalOverseasIncome_amt, lowerLimit, upperLimit)
    checkFieldMinMaxAmount("Earning Not Liable", liableEarnings.EarningNotLiable_amt, lowerLimit, upperLimit, true)
    checkFieldMinMaxAmount("Total Other Expenses Claimed", liableEarnings.TotalOtherExpensesClaimed_amt, BigDecimal.ZERO, upperLimit)
  }

  private function checkLiableEarningReCalculation(liableEarnings : INDLiableEarnings_ACC, isActual : boolean) {
    Context.addToVisited(this, "checkLiableEarningReCalculation")

    // For migrated data, calculations on the source system may have been different so we do not want to enforce recalculation
    if (Line.Branch.MigrationDisableRating_ACC) {
      return
    }
    var currentTotalEarnings = BigDecimal.ZERO
    var validationTotalEarnings = BigDecimal.ZERO

    var coverable = Line.INDCoPCovs.first()
    if (coverable != null and liableEarnings != null) {
      if (liableEarnings.TotalLiableEarnings != null) {
        currentTotalEarnings = liableEarnings.TotalLiableEarnings.Amount
      }
      validationTotalEarnings = LiableEarningsUtilities_ACC.calculateTotalLiableEarningsINDCoP(liableEarnings)
    }

    if (currentTotalEarnings != validationTotalEarnings
        and not isOverseasIncomeEdgeCase(currentTotalEarnings, validationTotalEarnings, liableEarnings)) {
      if (isActual) {
        Result.addError(Line, TC_DEFAULT, DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.CurrentYearsRecalculationRequired"))
      } else {
        Result.addError(Line, TC_DEFAULT, DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.PreviousYearsRecalculationRequired"))
      }
    }
  }

  /**
   * Edge case for OverseasIncome feature toggle
   * <p>
   * Scenario:
   * <p>
   * Overseas income is added while feature toggle is OFF
   * Then enable the feature toggle
   * Then start a policy change, and quote the policy immediately without updating earnings
   * <p>
   * OR add overseas income with the feature toggle ON, then do a blank policy change with feature toggle OFF
   *
   * @param currentTotalEarnings
   * @param validationTotalEarnings
   * @param liableEarnings
   * @return
   */
  private function isOverseasIncomeEdgeCase(
      currentTotalEarnings : BigDecimal,
      validationTotalEarnings : BigDecimal,
      liableEarnings : INDLiableEarnings_ACC) : boolean {

    var overseasIncome = liableEarnings.TotalOverseasIncome_amt
    if (overseasIncome == null or overseasIncome.IsZero) {
      return false
    }
    var delta = currentTotalEarnings - validationTotalEarnings
    var isEdgeCase = delta.abs() == overseasIncome.abs()
    return isEdgeCase
  }

  /**
   * Validation for Audit is not supported
   */
  override function validateLineForAudit() {
    throw new UnsupportedOperationException(DisplayKey.get("Validator.UnsupportedAuditLineError"))
  }
}