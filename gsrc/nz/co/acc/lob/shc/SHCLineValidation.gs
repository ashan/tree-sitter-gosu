package nz.co.acc.lob.shc

uses gw.api.locale.DisplayKey
uses gw.util.Pair
uses gw.validation.PCValidationContext
uses gw.policy.PolicyLineValidation
uses nz.co.acc.lob.common.DateUtil_ACC

uses java.math.BigDecimal

@Export
class SHCLineValidation extends PolicyLineValidation<entity.CWPSLine> {
  
  property get shcLine(): entity.CWPSLine {
    return Line
  }

  construct(valContext: PCValidationContext, polLine: entity.CWPSLine) {
    super(valContext, polLine)
  }
  
  override function doValidate() {
    // Add line-specific validation logic here
    validateAllCoverages()
    checkBICCodes_ACC()
    checkCUCodes_ACC()
    checkExpRatingModifiers()
    checkDiscountsAppliedModifiersHaveDates_ACC()
  }

  override function validateLineForAudit() {
    validateLineForAudit_ACC()
    validateAllCoverages()
    checkExpRatingModifiers()
    checkDiscountsAppliedModifiersHaveDates_ACC()
  }

  override function validateCoveragesForAudit_ACC() {
    validateAllCoverages()
  }

  /**
   * Validate Shareholder Coverages.
   * @param line an CWPSLine
   */
  static function validateCoverages(line : CWPSLine) {
    PCValidationContext.doPageLevelValidation(\context -> new SHCLineValidation(context, line).validateAllCoverages())
  }

  /**
   * Validate Shareholder Coverages.
   * @param line an CWPSLine
   */
  static function validateBICClassification(line : CWPSLine) {
    PCValidationContext.doPageLevelValidation(\context -> new SHCLineValidation(context, line).validateBICCU())
  }

  protected function validateAllCoverages() {
    checkEarnings_ACC()
    validateShareholders()
    hasPrimaryBICCode()
  }

  protected function validateBICCU() {
    checkBICCodes_ACC()
    checkCUCodes_ACC()
    hasPrimaryBICCode()
  }

  /**
   * Validate  Modifiers.
   * @param line an CWPSLine
   */
  static function validateModifiers(line : CWPSLine) {
    PCValidationContext.doPageLevelValidation( \ context -> new SHCLineValidation(context, line).validateModifiers())
  }

  private function validateModifiers() {
    checkDiscountsAppliedModifiersHaveDates_ACC()
  }

  /**
   * Check if the Liable Earnings are within min/max limits.
   */
  protected function checkEarnings_ACC() {
    Context.addToVisited(this, "checkEarnings")

    var shareholders = Line.PolicyShareholders
    for (she in shareholders) {
      for (shareholderEarnings in she.ShareholderEarnings) {
        checkLiableEarningsLimits(shareholderEarnings)
      }
    }
  }

  protected function hasPrimaryBICCode() {
    if(!Line.Branch.Migrated_ACC){
      if(Line.PrimaryBICCode_ACC == null) {
        Result.addError(Line , TC_DEFAULT, DisplayKey.get("Web.Policy.CWPS.NoPrimaryBIC_ACC"))
      }
    }
  }

  /**
   * Validate Shareholders
   * @param line a CWPSLine
   */
  protected function validateShareholders() {
    Context.addToVisited(this, "validateShareholders")
    checkShareholderCUs()
    checkShareholderACCIDs()
    checkShareholderPolicySHECPXDetails()
  }

  // Check that the correct CUs are associated with the shareholders
  private function checkShareholderCUs(){
    var cuSet = nz.co.acc.lob.shc.util.CWPSUIUtil_ACC.generateCUCodeSetFromPolicyLine(Line)
    for (shareholder in Line.PolicyShareholders) {
      for (shareholderEarnings in shareholder.ShareholderEarnings) {
        var cuCode = shareholderEarnings?.CUCode
        if (!cuCode.HasContent) {
          Result.addError(Line , TC_DEFAULT, DisplayKey.get("Web.Policy.CWPS.CUCodeRequired", shareholder.DisplayName))
        }
        if (cuCode.HasContent and !cuSet.contains(cuCode)) {
          Result.addError(Line , TC_DEFAULT, DisplayKey.get("Web.Policy.CWPS.CUCodeDoesNotExistOnShareholder", shareholder.DisplayName))
        }
      }
    }
  }

  // Check for Shareholders with duplicate ACCIDs
  private function checkShareholderACCIDs(){
    var nonDummyShareholders = Line.PolicyShareholders*.PolicyContact.where(\elt -> !elt.DummyContact_ACC)
    var accIDList = nonDummyShareholders*.ACCID_ACC.toList()
    if(accIDList.HasElements and accIDList.Count > accIDList.toSet().Count){
      this.Result.addError(Line, TC_DEFAULT, DisplayKey.get("Web.Policy.CWPS.ShareholderACCIDsAreNotUnique_ACC", accIDList))
    }
  }

  // Check that PolicySHECPXDetails start and end dates are between Policy start and end dates.
  private function checkShareholderPolicySHECPXDetails(){
    var policyStart = Line.Branch.PeriodStart
    var policyEnd = Line.Branch.PeriodEnd

    for (shareholder in Line.PolicyShareholders) {
      for (cpxDetails in shareholder.PolicySHECPXDetails){
        if(!DateUtil_ACC.isBetweenOrEqualIgnoreTime(cpxDetails?.cpxStartDate, policyStart, policyEnd) or
            !DateUtil_ACC.isBetweenOrEqualIgnoreTime(cpxDetails?.cpxEndDate, policyStart, policyEnd)){
          this.Result.addError(Line, TC_DEFAULT, DisplayKey.get("Web.Policy.CWPS.CPXPolicyDetailsMustBeBetweenPolicyStartAndEnd_ACC"))
        }
      }
    }
  }

  private function buildStartEndDatePairs(shareholder : PolicyShareholder_ACC) : List<Pair<Date, Date>>{
    var pairs = new ArrayList<Pair<Date, Date>>()
    for(details in shareholder.PolicySHECPXDetails) {
      pairs.add(new Pair(details.cpxStartDate, details.cpxEndDate))
    }
    return pairs
  }

  private function checkLiableEarningsLimits(liableEarnings : ShareholderEarnings_ACC) {
    Context.addToVisited(this, "checkLiableEarningsLimits")

    try {
      liableEarnings.validateFirstWeek_ACC()
    } catch(e : Exception) {
      this.Result.addError(Line, TC_DEFAULT, e.getMessage())
    }

    var lowerLimit = BigDecimal.valueOf(-100000000000)
    var upperLimit = BigDecimal.valueOf(100000000000)
    checkFieldMinMaxAmount("Liable Earnings", liableEarnings.LiableEarnings_amt, lowerLimit, upperLimit, true)
    checkFieldMinMaxAmount("Adjusted Liable Earnings", liableEarnings.AdjustedLiableEarnings_amt, lowerLimit, upperLimit, true)
    checkFieldMinMaxAmount("Remuneration", liableEarnings.Remuneration_amt, BigDecimal.ZERO, upperLimit)
    var audit = liableEarnings.Branch.CWPSLine.JobType == TC_AUDIT
    if (audit) {
      checkFieldMinMaxAmount("First Week", liableEarnings.FirstWeek_amt, BigDecimal.ZERO, upperLimit, true)
    }
  }
}