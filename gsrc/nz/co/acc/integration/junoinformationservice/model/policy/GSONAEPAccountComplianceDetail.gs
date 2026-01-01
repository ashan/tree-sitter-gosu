package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

class GSONAEPAccountComplianceDetail {
  public var publicId : String
  public var actionPlanAgreed : String
  public var actionPlanCompleted : String
  public var actionPlanRequested : String
  public var actionPlanRequired : Boolean
  public var annualAuditInfoReceived : String
  public var annualProcessCompletedBy : String
  public var auditLetterSent : String
  public var auditReportDueBy : String
  public var auditReportReceived : String
  public var auditResultAchieved : String // AEPAuditResult_ACC
  public var auditorName : String
  public var auditsRequired : String // AEPComplianceAudits_ACC
  public var compliance : Boolean
  public var complianceCompleted : String
  public var dateAppReceived : String
  public var dateSigned : String
  public var financialsReceived : String
  public var levyYear : Integer
  public var numberFtes : BigDecimal
  public var primarySite : String
  public var reminderEmailDueBy : String
  public var reminderEmailSent : String
  public var scheduledAuditDate : String
  public var secSite1 : String
  public var secSite2 : String
  public var secSite3 : String
  public var secSite4 : String
  public var weeklyCompensation : Boolean
  public var weeklyCompensationCompleted : String
}