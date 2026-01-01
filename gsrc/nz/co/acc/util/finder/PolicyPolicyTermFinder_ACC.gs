package nz.co.acc.util.finder

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths

/**
 * Created by Mike Ourednik on 16/08/20.
 */
class PolicyPolicyTermFinder_ACC {

  var _policy : Policy

  construct(policy : Policy) {
    _policy = policy
  }

  public function findLatestPolicyTerm() : PolicyTerm {
    return FinderUtil_ACC.findLatestPolicyTerm(_policy)
  }

  public function findMostRecentPolicyTerm() : PolicyTerm {
    return FinderUtil_ACC.findMostRecentPolicyTerm(_policy)
  }

  public function findPolicyTermForCurrentLevyYear() : PolicyTerm {
    return FinderUtil_ACC.findPolicyTermForLevyYear(_policy, Date.Now.LevyYear_ACC)
  }

  public function findPolicyTermForLevyYear(levyYear : Integer) : PolicyTerm {
    return FinderUtil_ACC.findPolicyTermForLevyYear(_policy, levyYear)
  }

  public function findPolicyTermsBetweenLevyYears(levyYear1 : int, levyYear2: int) : PolicyTerm[] {
    return FinderUtil_ACC.findPolicyTermsBetweenLevyYears(_policy, levyYear1, levyYear2)
  }

  public function policyTermExists() : Boolean {
    return FinderUtil_ACC.policyTermExists(_policy)
  }

  public function policyTerms() : List<PolicyTerm> {
    return Query.make(PolicyTerm).compare(PolicyTerm#Policy, Relop.Equals, _policy)
        .select()
        .orderBy(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#AEPFinancialYear_ACC)))
        .toList()
  }

  public function latestPeriodPerPolicyTerm(): List<PolicyPeriod> {
    return policyTerms()
        .map(\policyTerm -> policyTerm.findLatestBoundOrAuditedPeriod_ACC())
        .where(\period -> period != null and period.PeriodStart != period.CancellationDate)
  }

}