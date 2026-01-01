package nz.co.acc.aep.compliance

uses gw.assignment.AssignmentUtil
uses nz.co.acc.plm.util.AssignableQueueUtils

uses java.math.BigDecimal

/**
 * Created by Ian Rainford on 5/07/2017.
 */
class AEPActivityUtil {

  public static final var ACTIVITY_CODE_SEND_COMPLIANCE_DOCS: String = "aep_send_compliance_documents"
  public static final var ACTIVITY_CODE_AUDIT_REPORT_IS_DUE: String = "aep_audit_report_is_due"
  public static final var ACTIVITY_CODE_ANNUAL_PROCESS_DUE: String = "aep_annual_process_due"
  public static final var ACTIVITY_CODE_MONITOR_CUSTOMER: String = "aep_monitor_customer"
  public static final var ACTIVITY_CODE_RENEW_MASTER_POLICY: String = "aep_renew_master_policy_acc"
  public static final var ACTIVITY_CODE_INVOICE_RETURNED_GNA: String = "aep_invoice_returned_gna"

  public static final var AEP_ACTIVITY_CODES: String[] = {
      ACTIVITY_CODE_SEND_COMPLIANCE_DOCS, ACTIVITY_CODE_AUDIT_REPORT_IS_DUE,
      ACTIVITY_CODE_ANNUAL_PROCESS_DUE, ACTIVITY_CODE_MONITOR_CUSTOMER,
      ACTIVITY_CODE_RENEW_MASTER_POLICY, ACTIVITY_CODE_INVOICE_RETURNED_GNA
  }

  private static final var REMINDER_EMAIL_DUE_BY_MINUS = (ScriptParameters.getParameterValue("ReminderEmailDueByDays_ACC") as BigDecimal).intValue()
  private static final var AUDIT_REPORT_DUE_BY_MINUS = (ScriptParameters.getParameterValue("AuditReportDueByDays_ACC") as BigDecimal).intValue()
  private static final var ANNUAL_PROCESS_DUE_BY_MINUS = (ScriptParameters.getParameterValue("AnnualProcessDueByDays_ACC") as BigDecimal).intValue()



  public static function checkAndCreateAccountActivities(account : Account, aepAccountComplianceDetail : AEPAccountComplianceDetail_ACC) {
    var reminderEmailDueBy = aepAccountComplianceDetail.ReminderEmailDueBy
    var auditReportDueBy = aepAccountComplianceDetail.AuditReportDueBy
    var annualProcessCompletedBy = aepAccountComplianceDetail.AnnualProcessCompletedBy

    if (reminderEmailDueBy != null) {
      createAccountActivity(account, ACTIVITY_CODE_SEND_COMPLIANCE_DOCS, reminderEmailDueBy, REMINDER_EMAIL_DUE_BY_MINUS)
    }

    if (auditReportDueBy != null) {
      createAccountActivity(account, ACTIVITY_CODE_AUDIT_REPORT_IS_DUE, auditReportDueBy, AUDIT_REPORT_DUE_BY_MINUS)
    }

    if (annualProcessCompletedBy != null) {
      createAccountActivity(account, ACTIVITY_CODE_ANNUAL_PROCESS_DUE, annualProcessCompletedBy, ANNUAL_PROCESS_DUE_BY_MINUS)
    }
  }

  private static function createAccountActivity(account : Account, pattern : String, date : Date, numOfBusDaysToAdd : int) {
    var activityPattern = ActivityPattern.finder.getActivityPatternByCode(pattern)
    //We need to eliminate the pattern supplied target and escalation dates
    var totalTargetDays = date.addBusinessDays(numOfBusDaysToAdd - activityPattern.TargetDays)
    var totalEscalationDays = date.addBusinessDays(-1 * activityPattern.EscalationDays)

    gw.transaction.Transaction.runWithNewBundle(\ bundle -> {
      var activity = activityPattern.createAccountActivity(bundle, activityPattern, account, null, null, null, null, null, totalTargetDays, totalEscalationDays)
      var aepActivityQueue = AssignableQueueUtils.getQueueForAep()
      if (aepActivityQueue != null) {
        activity.assignActivityToQueue(aepActivityQueue, aepActivityQueue.getGroup())
      }
    })
  }

  public static function isAEPActivity(activity: Activity) : Boolean {
    return (AEP_ACTIVITY_CODES.contains(activity.ActivityPattern.Code))
  }
}