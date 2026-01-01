package nz.co.acc.lob.emp

uses gw.api.locale.DisplayKey
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC
uses gw.validation.PCValidationContext
uses gw.policy.PolicyLineValidation
uses java.math.BigDecimal

@Export
class EMPLineValidation extends PolicyLineValidation<entity.EMPWPCLine> {
  
  property get empLine(): entity.EMPWPCLine {
    return Line
  }

  construct(valContext: PCValidationContext, polLine: entity.EMPWPCLine) {
    super(valContext, polLine)
  }
  
  override function doValidate() {
    // Add line-specific validation logic here
    validateCoverage()
    checkExpRatingModifiers()
    checkDiscountsAppliedModifiersHaveDates_ACC()
  }

  /**
   * Validate EMP Coverages.
   * @param line an EMP Line
   */
  static function validateCoverages(line : EMPWPCLine) {
    PCValidationContext.doPageLevelValidation( \ context -> new EMPLineValidation(context, line).validateCoverage())
  }

  protected function validateCoverage() {
    checkBICCodes_ACC()
    checkCUCodes_ACC()
    checkPercentageTotal_ACC()
    checkEarnings_ACC()
  }

  protected function checkPercentageTotal_ACC() {
    Context.addToVisited(this, "checkPercentageTotal_ACC")

      if(!hasValidBICCodePercentage_ACC(this.Line.BICCodes)){
        var bicAllocationStringArray =  this.Line.BICCodes.map(\bic -> bic.BICCode + ": " + bic.Percentage + "%").toList()
        this.Result.addError(this.Line, ValidationLevel.TC_DEFAULT, DisplayKey.get("Web.PolicyLine.Validation.BICnot100Percent_ACC", bicAllocationStringArray))
      }
  }

  /**
   * Validate  Modifiers.
   * @param line an EMPWPCLine
   */
  static function validateModifiers(line : EMPWPCLine) {
    PCValidationContext.doPageLevelValidation( \ context -> new EMPLineValidation(context, line).validateModifiers())
  }

  private function validateModifiers() {
    checkDiscountsAppliedModifiersHaveDates_ACC()
  }

  private function getLiableEarnings() : EMPLiableEarnings_ACC {
    var liableEarnings = Line.EMPWPCCovs.first().getLiableEarnings()
    return liableEarnings
  }

  /**
   * Check if the Liable Earnings are within min/max limits.
   * Check if the Liable Earnings total calculation equal the current total liable earnings.
   */
  protected function checkEarnings_ACC() {
    Context.addToVisited(this, "checkEarnings")

    checkLiableEarningsLimits(getLiableEarnings())
    checkLiableEarningReCalculation()
  }

  private function checkLiableEarningsLimits(liableEarnings : EMPLiableEarnings_ACC) {
    Context.addToVisited(this, "checkLiableEarningsLimits")

    var lowerLimit = BigDecimal.valueOf(-100000000000)
    var upperLimit = BigDecimal.valueOf(100000000000)
    checkFieldMinMaxAmount("Total Gross Earnings", liableEarnings.TotalGrossEarnings_amt, lowerLimit, upperLimit, true)
    checkFieldMinMaxAmount("Total Earnings Not Liable", liableEarnings.TotalEarningsNotLiable_amt, lowerLimit, upperLimit, true)
    checkFieldMinMaxAmount("Total PAYE", liableEarnings.TotalPAYE_amt, lowerLimit, upperLimit, true)
    checkFieldMinMaxAmount("Total Excess Paid", liableEarnings.TotalExcessPaid_amt, lowerLimit, upperLimit, true)
    checkFieldMinMaxAmount("Payment To Employees", liableEarnings.PaymentToEmployees_amt, lowerLimit, upperLimit, true)
    checkFieldMinMaxAmount("Payment After First Week", liableEarnings.PaymentAfterFirstWeek_amt, lowerLimit, upperLimit, true)
  }

  /**
   * If the Liable Earnings total calculation doesn't equal the current total liable earnings then display an error.
   */
  private function checkLiableEarningReCalculation() {
    Context.addToVisited(this, "checkLiableEarningReCalculation")
    // on migrated data, calculations on the source system may have been different so we do not want to enforce recalculation
    // DE447 - Prevent recalulation validation for the prevent reassessment accounts
    if (Line.Branch.MigrationDisableRating_ACC or Line.Branch.IsAEPMemberPolicy_ACC or Line.AssociatedPolicyPeriod.Policy.Account.PreventReassessment_ACC) {
      return
    }
    var currentTotalEarnings = BigDecimal.ZERO
    var calcTotal = BigDecimal.ZERO
    var liableEarnings = getLiableEarnings()
    if (Line.EMPWPCCovs != null and Line.EMPWPCCovs.length > 0) {
      var coverable = Line.EMPWPCCovs.first()
      if (coverable != null and liableEarnings != null) {
        if (coverable.getLiableEarnings() != null) {
          if (liableEarnings.TotalLiableEarnings != null) {
            currentTotalEarnings = liableEarnings.TotalLiableEarnings.Amount
          }
          calcTotal = LiableEarningsUtilities_ACC.calculateTotalLiableEarningsEMPWPC(coverable)
        }
      }
    }
    if (currentTotalEarnings != calcTotal) {
      Result.addError(Line , TC_DEFAULT, DisplayKey.get("Web.WorkPlaceCover_ACC.Coverage.LiableEarnings.RecalculationRequired"))
    }
    if (currentTotalEarnings < BigDecimal.ZERO and liableEarnings.PaymentAfterFirstWeek_amt.IsZero and liableEarnings.PaymentToEmployees_amt.IsZero) {
      Result.addError(Line , TC_DEFAULT, DisplayKey.get("Web.WorkPlaceCover_ACC.Coverage.LiableEarnings.TotalLiableEarningsCannotBeNegative"))
    }
  }

  override function validateLineForAudit() {
    validateLineForAudit_ACC()
    validateCoverage()
    checkExpRatingModifiers()
    checkDiscountsAppliedModifiersHaveDates_ACC()
  }

  override function validateCoveragesForAudit_ACC() {
    validateCoverage()
  }
}