package nz.co.acc.plm.integration.ir.util

uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Common methods created for Policies...
 */
enhancement PolicyEnhancement : Policy {

  /**
   * Clean up unfinished jobs created in backend...
   * Recyclable jobs only will be cleaned.
   *
   * @param bundle     - not currently used, however may be in future.
   * @param reasonCode
   */
  public function cleanUpInternalJobs_ACC(bundle : Bundle, reasonCode : ReasonCode) {
    cleanUpJobs(reasonCode, true, 0)
  }

  /**
   * Clean up unfinished jobs created in backend...
   * Recyclable jobs only will be cleaned.
   *
   * @param bundle     - not currently used, however may be in future.
   * @param reasonCode
   * @param levyYear
   */
  public function cleanUpInternalJobs_ACC(bundle : Bundle, reasonCode : ReasonCode, levyYear : int) {
    cleanUpJobs(reasonCode, true, levyYear)
  }

  /**
   * Clean up unfinished jobs created in backend...
   * Recyclable jobs only will be cleaned.
   *
   * @param bundle     - not currently used, however may be in future.
   * @param reasonCode
   * @param levyYear
   */
  public function withdrawDraftAudits(bundle : Bundle, levyYear : int) {
    cleanUpAuditJobs(levyYear)
  }

  private function cleanUpAuditJobs(levyYear : int) {
    var fn = "cleanUpJobs"
    var jobs : Job[]

    jobs = getAuditJobsForCleanup(levyYear)

    jobs.each(\job -> {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\newBundle -> {
        try {
          var editable = BundleHelper.explicitlyAddBeanToBundle(newBundle, job, false)
          editable.withdraw()
        } catch (e : Exception) {
          StructuredLogger.INTEGRATION.warn_ACC(this + " " + fn + " " + "Can't clean internal jobs for Policy[${this.PublicID}]!")
        }
      })
    })
  }

  /**
   * Clean up unfinished jobs created in backend...
   * Can clean non recyclable jobs.
   *
   * @param bundle          - not currently used, however may be in future.
   * @param checkRecyclable - If true, only recyclable jobs will be cleaned.  If false, even non recyclable jobs will be cleaned.
   * @param reasonCode
   */
  public function cleanUpInternalJobs_ACC(bundle : Bundle, reasonCode : ReasonCode, checkRecyclable : boolean) {
    cleanUpJobs(reasonCode, checkRecyclable, 0)
  }

  private function cleanUpJobs(reasonCode : ReasonCode, checkRecyclable : boolean, levyYear : int) {
    var fn = "cleanUpJobs"
    var jobs : Job[]

    jobs = getJobsForCleanup(checkRecyclable, reasonCode, levyYear)

    jobs.each(\job -> {
      try {
        gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\newBundle -> {
          var editable = BundleHelper.explicitlyAddBeanToBundle(newBundle, job, false)
          editable.withdraw()
        })
      } catch (e : Exception) {
        StructuredLogger.INTEGRATION.warn_ACC( this + " " + fn + " " +
            "Failed to clean Job[${job.ID}] for Policy[${this.PublicID}]" + "  " + e)
      }
    })
  }

  private function getJobsForCleanup(checkRecyclable : boolean, reasonCode : ReasonCode, levyYear : int) : Job[] {
    var allJobs = this.Jobs.where(\job -> !job.isComplete() && job.InternalJob_ACC && job.TriggerReason_ACC == reasonCode && isAuditJobCleanable(job))
    var recyclableJobs : Job[]
    var levyYearJobs : Job[]

    // Not good practice to do allJobs = allJobs.where, hence we use extra variables

    if (checkRecyclable) {
      recyclableJobs = allJobs.where(\elt -> elt.Recyclable_ACC)
      allJobs = recyclableJobs
    }

    if (levyYear != 0) {
      levyYearJobs = allJobs.where(\j -> j.Periods.hasMatch(\pp -> pp.LevyYear_ACC == levyYear))
    }

    if (levyYearJobs != null) {
      return levyYearJobs
    } else {
      return allJobs
    }
  }

  private function getAuditJobsForCleanup(levyYear : int) : Job[] {
    var allJobs = this.Jobs.where(\job -> !job.isComplete() && job.Subtype == typekey.Job.TC_AUDIT)
    var levyYearJobs : Job[]

    if (levyYear != 0) {
      levyYearJobs = allJobs.where(\j -> j.Periods.hasMatch(\pp -> pp.LevyYear_ACC == levyYear))
    }

    if (levyYearJobs != null) {
      return levyYearJobs
    } else {
      return allJobs
    }
  }

  // We ONLY clean audit revisions.  Plain audits shouldn't be attempted to be withdrawn as it makes no sense.
  // We need to hang onto the draft version of the audit to be fixed later.
  private function isAuditJobCleanable(job : Job) : boolean {
    return job.Subtype == typekey.Job.TC_AUDIT && job.isRevision() || (job.Subtype != typekey.Job.TC_AUDIT)
  }
}
