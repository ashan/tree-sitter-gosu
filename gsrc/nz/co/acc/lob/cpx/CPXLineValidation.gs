package nz.co.acc.lob.cpx

uses gw.api.locale.DisplayKey
uses gw.util.Pair
uses gw.validation.PCValidationContext
uses gw.policy.PolicyLineValidation
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.util.ModifiersUtil_ACC

uses java.lang.UnsupportedOperationException

@Export
class CPXLineValidation extends PolicyLineValidation<entity.INDCPXLine> {
  
  property get cpxLine(): entity.INDCPXLine {
    return Line
  }

  construct(valContext: PCValidationContext, polLine: entity.INDCPXLine) {
    super(valContext, polLine)
  }
  
  override function doValidate() {
    // Add line-specific validation logic here
    validateCPXLine()
  }

  /**
   * Validate Individual Coverages.
   * @param line an Individual
   */
  static function validateCoverages(line : INDCPXLine) {
    PCValidationContext.doPageLevelValidation( \ context -> new CPXLineValidation(context, line).validateCPXLine())
  }

  protected function validateCPXLine() {
    checkBICCodes_ACC()
    checkCUCodes_ACC()
    validateCPXDates()
  }

  protected function validateCPXDates() {
    var cpxEarnings = Line.INDCPXCovs.first().CPXInfoCovs
    var dateRanges = new ArrayList<Pair<Date, Date>>()
    for (earnings in cpxEarnings) {
      if(earnings.IsCPXPeriodDatesSet and
         (DateUtil_ACC.isAfterDay(earnings.PeriodStart, Line.ExpirationDate) or
          DateUtil_ACC.isAfterDay(earnings.PeriodEnd, Line.ExpirationDate))) {
        Result.addError(Line , TC_DEFAULT, DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.DateAfterPolicyExpirationDate",
                                                          DateUtil_ACC.createDateAsString(earnings.PeriodStart),
                                                          DateUtil_ACC.createDateAsString(earnings.PeriodEnd),
                                                          DateUtil_ACC.createDateAsString(Line.ExpirationDate)))
        break;
      }
      dateRanges.add(new Pair(earnings.PeriodStart, earnings.PeriodEnd))
    }
    checkCPXDates(dateRanges)
  }

  private function checkCPXDates(cpxDates : ArrayList<Pair<Date, Date>>) {
    for(dateToCheck in cpxDates) {
      var dateAgainst = cpxDates.firstWhere(\elt -> dateToCheck != elt and validateDateRanges(dateToCheck, elt))
      if(dateAgainst != null) {
        Result.addError(Line , TC_DEFAULT, DisplayKey.get("Web.CoverPlusExtra_ACC.Coverage.DateConflictsFound",
                                                          DateUtil_ACC.createDateAsString(dateToCheck.First),
                                                          DateUtil_ACC.createDateAsString(dateToCheck.Second),
                                                          DateUtil_ACC.createDateAsString(dateAgainst.First),
                                                          DateUtil_ACC.createDateAsString(dateAgainst.Second)))
        break
      }
    }
  }

  protected function validateDateRanges(date1 : Pair<Date,Date>, date2: Pair<Date,Date>) : boolean {
    if(((DateUtil_ACC.isBeforeDay(date1.First, date2.Second) or DateUtil_ACC.isSameDay(date1.First, date2.Second)) and
        (DateUtil_ACC.isAfterDay(date1.Second, date2.First) or DateUtil_ACC.isSameDay(date1.Second, date2.First))) ) {
      return true
    }
    return false
  }

  /**
   * Validation for Audit is not supported
   */
  override function validateLineForAudit() {
    throw new UnsupportedOperationException(DisplayKey.get("Validator.UnsupportedAuditLineError"))
  }
}