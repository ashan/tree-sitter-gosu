package nz.co.acc.aep.migration

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.migration.util.MigrationUtil_ACC
uses nz.co.acc.policy.function.PolicyPeriodCancelReasonUpdate

/**
 * This is enhancement methods specific for migration
 */
enhancement AEPPolicyPeriodEnhancement: PolicyPeriod {

  /**
   * Move policy to a new Account with new PolicyNumber
   *
   */
  function rewriteMigratedPolicy_ACC(toAccount: Account, effectiveDate: Date, newPolicyNumber: String) : Job[] {
    this.validateAEPRewritePolicy_ACC(toAccount, effectiveDate)
    var jobList = new ArrayList<Job>()
    var cancellationPP = this
    var migrationJobInfo = this.Job.MigrationJobInfo_ACC
    if (not this.Canceled) {
      try {
        var job = new Cancellation()
        job.Source = CancellationSource.TC_CARRIER
        if (toAccount.AEPContractAccount_ACC) {
          job.CancelReasonCode = ReasonCode.TC_JOINEDAEPGROUP_ACC
        } else {
          job.CancelReasonCode = ReasonCode.TC_REMOVEDFROMAEPGROUP_ACC
        }
        MigrationUtil_ACC.copyMigrationJobInfoToJob(migrationJobInfo, job)
        if (job.MigrationJobInfo_ACC.AEPMigrationInfo.AEPMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_ENTRY) {
          // For mid term entry, the cancellation should be zero rated.
          job.startJob(this.Policy, effectiveDate, CalculationMethod.TC_SHORTRATE)
        } else if (this.PeriodStart.compareIgnoreTime(effectiveDate) >= 0) {
          job.startJob(this.Policy, this.PeriodStart, CalculationMethod.TC_FLAT)
        } else {
          job.startJob(this.Policy, effectiveDate, CalculationMethod.TC_PRORATA)
        }

        var period = job.LatestPeriod
        period.CancellationProcess.cancelImmediately()

        Funxion.buildExecutor(new PolicyPeriodCancelReasonUpdate(period)).execute(job.CancelReasonCode)

        jobList.add(job)
        cancellationPP = job.LatestPeriod

      } catch (e : Exception) {
        StructuredLogger.INTEGRATION.error_ACC("rewritePolicy", e)
        throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Error.CancellationError"))
      }
    }
    try {
      if (! this.Policy.RewrittenToNewAccountDestination?.Periods?.HasElements) {
        RewriteNewAccount.startRewriteNewAccount(new PolicyPeriod[]{cancellationPP}, toAccount)
      }

      var newPP = this.Policy.RewrittenToNewAccountDestination.Periods?.first()
      if (newPP != null) {
        MigrationUtil_ACC.copyMigrationJobInfoToJob(migrationJobInfo, newPP.RewriteNewAccount)
        newPP.Migrated_ACC = true
        newPP.PolicyNumber = newPolicyNumber
        newPP.PolicyTerm.AEPMigratedNoRenewal_ACC = this.PolicyTerm.AEPMigratedNoRenewal_ACC
        newPP.PolicyTerm.ActiveTerm_ACC = this.PolicyTerm.ActiveTerm_ACC

        // copy holds
        newPP.PolicyTerm.HoldReassessment_ACC = this.PolicyTerm.HoldReassessment_ACC
        foreach(oldHoldReason in this.PolicyTerm.HoldReasons_ACC) {
          var newHoldReason = oldHoldReason.copy() as ReassessmentReasons_ACC
          newPP.PolicyTerm.addToHoldReasons_ACC(newHoldReason)
        }

        newPP.JobProcess.requestQuote()
        newPP.onBeginIssueJob()
        newPP.RewriteNewAccountProcess.rewriteNewAccount()
      }
      jobList.add(newPP.RewriteNewAccount)
    } catch (e : Exception) {
      StructuredLogger.CONFIG.error_ACC("rewritePolicy", e)
      throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Error.RewriteError"))
    }
    return jobList.toTypedArray()
  }

  property get IsAEPMigrationZeroRatedTransaction_ACC() : boolean {
    var aepMigrationType = this.Job.MigrationJobInfo_ACC.AEPMigrationInfo.AEPMigrationType
    return aepMigrationType != null and
           (aepMigrationType == AEPMigrationType_ACC.TC_AEP_FULL_TERM or
            (aepMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_EXIT and (this.Job typeis Submission or
                                                                                this.Job typeis Cancellation)))
  }

  property get IsAEPMigration() : boolean {
    var aepMigrationType = this.Job.MigrationJobInfo_ACC.AEPMigrationInfo.AEPMigrationType
    return aepMigrationType != null and aepMigrationType != AEPMigrationType_ACC.TC_WPC_WPS_FULL_TERM
  }

}