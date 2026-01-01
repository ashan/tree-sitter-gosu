package nz.co.acc.plm.integration.ir.util

/**
 * Created by Swati Patel on 2/08/2017.
 */
enhancement JobEnhancement: Job {

  /**
   * Is this job an audit revision.
   *
   * @return - true if revision
   */
  public function isRevision(): boolean {
    var audit = this.LatestPeriod.Audit
    return (audit != null && audit.AuditInformation.RevisionType == RevisionType.TC_REVISION)
  }
}
