package nz.co.acc.aep.compliance

uses gw.api.locale.DisplayKey

uses java.math.BigDecimal

/**
 * Created by Ian Rainford on 5/07/2017.
 */
class AEPComplianceDatesUtil {

  private static final var ANNUAL_PROCESS_COMPLETED_BY_YEARS = 1 //Annual is always one!
  private static final var MINUS_DATE_AUDIT_REPORT_DUE = (ScriptParameters.getParameterValue("DateAuditReportDueDays_ACC") as BigDecimal).intValue()
  private static final var MINUS_REMINDER_EMAIL = (ScriptParameters.getParameterValue("ReminderEmailDays_ACC") as BigDecimal).intValue()

  /**
   * Initialise the AEP Compliance due dates
   * @param policyPeriod
   */
  public static function initDueDates(account : Account, aepAccountComplianceDetail : AEPAccountComplianceDetail_ACC) {
    // Find the previous year's AnnualProcessCompletedBy date
    // Only initialise the due dates if this is not the first AEPAccountComplianceDetails
    if (aepAccountComplianceDetail.LevyYear != null and account?.AEPAccountComplianceDetails?.HasElements) {
      var previousYearsAnnualProcessCompletedBy = account?.AEPAccountComplianceDetails?.lastWhere(\detail -> detail.LevyYear == aepAccountComplianceDetail.LevyYear - 1).AnnualProcessCompletedBy
      if (previousYearsAnnualProcessCompletedBy != null) {
        var annualProcessCompletedBy = previousYearsAnnualProcessCompletedBy.addYears(ANNUAL_PROCESS_COMPLETED_BY_YEARS)
        setDueDates(annualProcessCompletedBy, aepAccountComplianceDetail)
      }
    }
  }

  public static function setDueDates(annualProcessCompletedBy : Date, aepAccountComplianceDetail : AEPAccountComplianceDetail_ACC) {
    aepAccountComplianceDetail.AnnualProcessCompletedBy = annualProcessCompletedBy
    aepAccountComplianceDetail.AuditReportDueBy = annualProcessCompletedBy.addDays(MINUS_DATE_AUDIT_REPORT_DUE)
    aepAccountComplianceDetail.ReminderEmailDueBy = annualProcessCompletedBy.addDays(MINUS_REMINDER_EMAIL)
  }

  public static function validateLevyYear(account : Account, aepAccountComplianceDetail : AEPAccountComplianceDetail_ACC) : String {
    var currentLevyYears : List<Integer> = new ArrayList<Integer>()
    account.AEPAccountComplianceDetails.each(\complianceDetail -> {
      currentLevyYears.add(complianceDetail.LevyYear)
    })
    if (currentLevyYears.contains(aepAccountComplianceDetail.LevyYear) and aepAccountComplianceDetail.New) {
      return DisplayKey.get("Web.AEPAccountComplianceDetails_ACC.Validation.LevyYearAlreadyExists", aepAccountComplianceDetail.LevyYear)
    }
    return null
  }

}