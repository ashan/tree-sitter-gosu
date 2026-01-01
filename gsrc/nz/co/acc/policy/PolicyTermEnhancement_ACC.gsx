package nz.co.acc.policy

uses nz.co.acc.util.finder.FinderUtil_ACC
uses gw.api.database.Relop

/**
 * Enhancement for Policy Term.
 */
enhancement PolicyTermEnhancement_ACC : PolicyTerm {

  property get CeasedTrading_ACC() : boolean {
    return this.CeasedTradingDate_ACC != null
  }

  public function findLatestBoundOrAuditedPeriod_ACC() : PolicyPeriod {
    return FinderUtil_ACC.findLatestBoundOrAuditedPeriod(this)
  }

  function findAllPeriods_ACC(): List<PolicyPeriod>  {
    return FinderUtil_ACC.findAllPeriodsForPolicyTerm(this)
  }

  function findAllBoundPeriods_ACC(): List<PolicyPeriod>  {
    return FinderUtil_ACC.findAllBoundPeriodsForPolicyTerm(this)
  }

  function findLatestBoundPeriod_ACC(): PolicyPeriod  {
    return FinderUtil_ACC.findLatestBoundPeriodForPolicyTerm(this)
  }

  function findLatestAuditedPeriod_ACC(): PolicyPeriod  {
    return FinderUtil_ACC.findLatestAuditedPeriodForPolicyTerm(this)
  }

  function hasFinalAudit_ACC(): Boolean {
    return FinderUtil_ACC.checkFinalAuditExistsForPolicyTerm(this)
  }

  function findLatestBoundOrAuditedPeriodForDate_ACC(date: Date) : PolicyPeriod {
    return FinderUtil_ACC.findLatestBoundOrAuditedPeriodForDate_ACC(this, date)
  }

  public function findPolicyPeriodByMostRecentID() : PolicyPeriod {
    return gw.api.database.Query.make(PolicyPeriod)
                                .compare(PolicyPeriod#ID, Relop.Equals, this.LatestBranchID_ACC)
                                .select().first()
  }

}