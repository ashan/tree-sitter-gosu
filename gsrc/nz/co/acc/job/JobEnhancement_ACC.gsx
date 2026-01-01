package nz.co.acc.job

uses pcf.AuditWizard
uses pcf.JobForward
uses pcf.PolicyChangeLinkPopup
uses typekey.Job
uses gw.job.JobProcess

/**
 * Job enhancements
 */
enhancement JobEnhancement_ACC : entity.Job {
  /**
   * Is this a migration job
   */
  property get MigrationJob_ACC() : boolean {
    return this.MigrationJobInfo_ACC != null or User.util.CurrentUser?.MigrationUser
  }

  property get ResultingBoundPeriod_ACC() : PolicyPeriod {
    return this typeis Audit ? this.SelectedVersion : this.ResultingBoundPeriod
  }

  property get LatestPolicyPeriod() : PolicyPeriod {
    var period = this.LatestPeriod
    if (this typeis PolicyChange) {
      return period
    }
    return period.getSlice(period.EditEffectiveDate)
  }

  property get IsSubmission_ACC() : Boolean {
    return this.Subtype == Job.TC_SUBMISSION
  }

  property get IsRenewal_ACC() : Boolean {
    return this.Subtype == Job.TC_RENEWAL
  }

  property get IsAudit_ACC() : Boolean {
    return this.Subtype == Job.TC_AUDIT
  }

  property get IsPolicyChange_ACC() : Boolean {
    return this.Subtype == Job.TC_POLICYCHANGE
  }

  property get IsRewriteNewAccount() : Boolean {
    return this.Subtype == Job.TC_REWRITENEWACCOUNT
  }

}
