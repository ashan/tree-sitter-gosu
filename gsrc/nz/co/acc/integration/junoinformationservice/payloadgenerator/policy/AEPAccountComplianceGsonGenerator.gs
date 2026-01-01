package nz.co.acc.integration.junoinformationservice.payloadgenerator.policy

uses gw.util.GosuStringUtil
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONAEPAccountComplianceDetail

uses java.math.BigDecimal

class AEPAccountComplianceGsonGenerator {

  function generate(entity : AEPAccountComplianceDetail_ACC) : GSONAEPAccountComplianceDetail {
    if (entity == null) {
      return null
    }

    var gsonDoc = new GSONAEPAccountComplianceDetail()

    gsonDoc.publicId = entity.PublicID
    gsonDoc.actionPlanAgreed = entity.ActionPlanAgreed?.toISODate()
    gsonDoc.actionPlanCompleted = entity.ActionPlanCompleted?.toISODate()
    gsonDoc.actionPlanRequested = entity.ActionPlanRequested?.toISODate()
    gsonDoc.actionPlanRequired = entity.ActionPlanRequired
    gsonDoc.annualAuditInfoReceived = entity.AnnualAuditInfoReceived?.toISODate()
    gsonDoc.annualProcessCompletedBy = entity.AnnualProcessCompletedBy?.toISODate()
    gsonDoc.auditLetterSent = entity.AuditLetterSent?.toISODate()
    gsonDoc.auditReportDueBy = entity.AuditReportDueBy?.toISODate()
    gsonDoc.auditReportReceived = entity.AuditReportReceived?.toISODate()
    gsonDoc.auditResultAchieved = entity.AuditResultAchieved?.Code
    gsonDoc.auditorName = entity.AuditorName
    gsonDoc.auditsRequired = entity.AuditsRequired?.Code
    gsonDoc.compliance = entity.Compliance
    gsonDoc.complianceCompleted = entity.ComplianceCompleted?.toISODate()
    gsonDoc.dateAppReceived = entity.DateAppReceived?.toISODate()
    gsonDoc.dateSigned = entity.DateSigned?.toISODate()
    gsonDoc.financialsReceived = entity.FinancialsReceived?.toISODate()
    gsonDoc.levyYear = entity.LevyYear
    gsonDoc.numberFtes = stringToBigDecimal(entity.NumberFTEs)
    gsonDoc.primarySite = entity.PrimarySite
    gsonDoc.reminderEmailDueBy = entity.ReminderEmailDueBy?.toISODate()
    gsonDoc.reminderEmailSent = entity.ReminderEmailSent?.toISODate()
    gsonDoc.scheduledAuditDate = entity.ScheduledAuditDate?.toISODate()
    gsonDoc.secSite1 = entity.SecSite1
    gsonDoc.secSite2 = entity.SecSite2
    gsonDoc.secSite3 = entity.SecSite3
    gsonDoc.secSite4 = entity.SecSite4
    gsonDoc.weeklyCompensation = entity.WeeklyCompensation
    gsonDoc.weeklyCompensationCompleted = entity.WeeklyCompensationCompleted?.toISODate()

    return gsonDoc
  }

  private function stringToBigDecimal(value: String): BigDecimal {
    if (GosuStringUtil.isBlank(value)) {
      return null
    }
    value = value.replace(",", "")
    try {
      return value.toBigDecimal()
    } catch (e: Exception) {
      throw new RuntimeException("Failed to parse string as bigdecimal: [${value}]", e)
    }
  }

}