package nz.co.acc.util.finder

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.api.policy.period.PolicyPeriodQueryFilters
uses gw.pl.persistence.core.Key
uses nz.co.acc.common.util.HikariJDBCConnectionPool
uses nz.co.acc.gwer.util.SelectLatestPeriodFromPolicyTerm

/**
 * Created by Mike Ourednik on 16/08/20.
 */
class FinderUtil_ACC {

  static public function findPolicyTerms(accID : String, productCode : String, levyYear : Integer) : PolicyTerm[] {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPACCNumber_ACC, Relop.Equals, accID)
        .compare(PolicyTerm#AEPProductCode_ACC, Relop.Equals, productCode)
        .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.Equals, levyYear)
        .select()
        .orderBy(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#CreateTime)))
        .toTypedArray()
  }

  static public function findLatestPolicyTerm(accID : String, productCode : String, levyYear : Integer) : PolicyTerm {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPACCNumber_ACC, Relop.Equals, accID)
        .compare(PolicyTerm#AEPProductCode_ACC, Relop.Equals, productCode)
        .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.Equals, levyYear)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#CreateTime)))
        .FirstResult
  }

  public static function findLatestPolicyTerm(accID : String, productCode : String) : PolicyTerm {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPACCNumber_ACC, Relop.Equals, accID)
        .compare(PolicyTerm#AEPProductCode_ACC, Relop.Equals, productCode)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#AEPFinancialYear_ACC)))
        .thenByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#CreateTime)))
        .FirstResult
  }

  static public function findLatestNonAEPMasterPolicyTerm(accID : String, productCode : String, levyYear : Integer) : PolicyTerm {
    var policyTerms = findPolicyTerms(accID, productCode, levyYear)
    return policyTerms?.lastWhere(\pt -> not pt.Policy.IsAEPMemberPolicy_ACC)
  }

  static public function findPolicyTermsForAccount(accID : String) : List<PolicyTerm> {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPACCNumber_ACC, Equals, accID)
        .select()
        .orderBy(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#AEPFinancialYear_ACC)))
        .toList()
  }

  static public function findPolicyTermsBetweenLevyYears(policy : Policy, levyYear1 : int, levyYear2: int) : PolicyTerm[] {
    return Query.make(PolicyTerm)
        .between(PolicyTerm#AEPFinancialYear_ACC, levyYear1, levyYear2)
        .compare(PolicyTerm#Policy, Relop.Equals, policy)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#CreateTime)))
        .toTypedArray()

  }

  static public function findPolicyTermForLevyYear(policy : Policy, levyYear : Integer) : PolicyTerm {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.Equals, levyYear)
        .compare(PolicyTerm#Policy, Relop.Equals, policy)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#CreateTime)))
        .FirstResult
  }

  /**
   * Returns latest policy term, excluding pre-renewal policy term with null ACCNumber/ProductCode
   *
   * @param policy
   * @return
   */
  static public function findLatestPolicyTerm(policy : Policy) : PolicyTerm {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#Policy, Relop.Equals, policy)
        .compare(PolicyTerm#AEPACCNumber_ACC, Relop.NotEquals, null)
        .compare(PolicyTerm#AEPProductCode_ACC, Relop.NotEquals, null)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#AEPFinancialYear_ACC)))
        .thenByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#CreateTime)))
        .FirstResult
  }

  static public function findMostRecentPolicyTerm(policy : Policy) : PolicyTerm {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#Policy, Relop.Equals, policy)
        .compare(PolicyTerm#MostRecentTerm, Relop.Equals, true)
        .select()
        .FirstResult
  }

  static public function policyTermExists(policy : Policy) : Boolean {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#Policy, Relop.Equals, policy)
        .select()
        .getCountLimitedBy(1) > 0
  }

  static function findAllPeriodsForPolicyTerm(policyTerm : PolicyTerm) : List<PolicyPeriod> {
    return Query.make(PolicyPeriod)
        .compare(PolicyPeriod#PolicyTerm, Relop.Equals, policyTerm)
        .select()
        .toList()
  }

  static function checkFinalAuditExistsForPolicyTerm(policyTerm : PolicyTerm) : Boolean {
    return Query.make(PolicyPeriod)
        .compare(PolicyPeriod#PolicyTerm, Relop.Equals, policyTerm)
        .compare(PolicyPeriod#Status, Relop.Equals, PolicyPeriodStatus.TC_AUDITCOMPLETE)
        .select()
        .getCountLimitedBy(1) > 0
  }

  static public function findAllBoundPeriodsForPolicyTerm(policyTerm : PolicyTerm) : List<PolicyPeriod> {
    return Query.make(PolicyPeriod)
        .compare(PolicyPeriod#Status, Relop.Equals, PolicyPeriodStatus.TC_BOUND)
        .compare(PolicyPeriod#PolicyTerm, Relop.Equals, policyTerm)
        .select()
        .toList()
  }

  static public function findLatestBoundPeriodForPolicyTerm(policyTerm : PolicyTerm) : PolicyPeriod {
    return Query.make(PolicyPeriod)
        .compare(PolicyPeriod#Status, Relop.Equals, PolicyPeriodStatus.TC_BOUND)
        .compare(PolicyPeriod#PolicyTerm, Relop.Equals, policyTerm)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyPeriod#ModelDate)))
        .FirstResult?.getSliceAtEffectiveDate_ACC()
  }

  static public function findLatestBoundOrAuditedPeriodForDate_ACC(policyTerm : PolicyTerm, date : Date) : PolicyPeriod {
    var boundOrAuditedPeriods = Query.make(PolicyPeriod)
        .compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
        .compare(PolicyPeriod#PolicyTerm, Relop.Equals, policyTerm)
        .select()
        .toTypedArray()
    return boundOrAuditedPeriods
        .where(\pp -> pp.EditEffectiveDate.beforeOrEqual(date) && pp.PeriodEnd.after(date))
        .orderByDescending(\pp -> pp.ModelDate != null ? pp.ModelDate : pp.UpdateTime)
        .first()?.getSliceAtEffectiveDate_ACC()
  }

  static public function findLatestBoundOrAuditedPeriod(policyTerm : PolicyTerm) : PolicyPeriod {
    var sqlQuery = SelectLatestBoundOrAuditedPeriodForPolicyTerm.renderToString()
    return selectPeriodFromSql(policyTerm, sqlQuery)
  }

  public function findLatestBoundOrAuditedPeriodER(policyTerm : PolicyTerm) : PolicyPeriod {
    var sqlQuery = SelectLatestPeriodFromPolicyTerm.renderToString()
    return selectPeriodFromSql(policyTerm, sqlQuery)
  }

  static public function findLatestAuditedPeriodForPolicyTerm(policyTerm : PolicyTerm) : PolicyPeriod {
    var sqlQuery = SelectLatestAuditedPeriodForPolicyTerm.renderToString()
    return selectPeriodFromSql(policyTerm, sqlQuery)
  }

  static private function selectPeriodFromSql(policyTerm : PolicyTerm, sqlQuery : String) : PolicyPeriod {
    var connection = HikariJDBCConnectionPool.getInstance().getConnection()

    var preparedStatement = connection.prepareStatement(sqlQuery)
    preparedStatement.setLong(1, policyTerm.ID.Value)

    var periodID : Long

    try {
      var resultSet = preparedStatement.executeQuery()
      if (resultSet.next()) {
        periodID = resultSet.getLong(1)
      }
    } finally {
      preparedStatement.close()
      connection.close()
    }

    if (periodID == null) {
      return null
    }

    var period = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#ID, Relop.Equals, new Key(PolicyPeriod, periodID))
        .select()
        .FirstResult

    return period?.getSliceAtEffectiveDate_ACC()
  }

  /**
   * Retrieves bound policy periods of a given policy.
   * The approach is similar to the OOTB query that provides list of policy periods for
   * the account summary policy terms, but in this case is based on policy.
   * As the OOTB query, this doesn't return policy periods of audit transactions
   *
   * @param policy the given policy
   * @return list of bound policy periods
   */
  static function findLatestBoundPolicyPeriodsForPolicy(policy : Policy) : List<PolicyPeriod> {
    var orderBy = QuerySelectColumns.path(Paths.make(PolicyPeriod#LevyYear_ACC))
    var query = Query.make(PolicyPeriod)
      .compare(PolicyPeriod#Policy, Relop.Equals, policy)
    PolicyPeriodQueryFilters.boundInForce(query)
    return query.select().orderBy(orderBy).toList()
  }
}