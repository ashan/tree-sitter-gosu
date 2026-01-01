package nz.co.acc.aep.compliance

/**
 * Created by Ian Rainford on 10/07/2017.
 */
enhancement AEPComplianceDetailEnhancement: AEPComplianceDetail_ACC {
  public function clearDataFieldsOnRenewal() {
    //Sites
    this.PrimarySite = null
    this.SecSite1 = null
    this.SecSite2 = null

    //Audits
    this.AuditsRequired = null

    //Process
    this.DateAppReceived = null
    this.ReminderEmailSent = null
    this.AnnualAuditInfoReceived = null
    this.FinancialsReceived = null
    this.AuditLetterSent = null
    this.AuditReportReceived = null
    this.ActionPlanRequired = null
    this.DateSigned = null

    //Result
    this.AuditResultAchieved = null
  }
}
