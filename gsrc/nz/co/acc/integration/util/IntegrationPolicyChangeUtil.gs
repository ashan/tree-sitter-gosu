package nz.co.acc.integration.util

uses gw.api.database.Query
uses gw.api.database.Relop

/**
 * Created by Mike Ourednik on 25/02/2021.
 */
class IntegrationPolicyChangeUtil {

  public static function assertNoOpenPolicyTransactions(policyPeriods : List<PolicyPeriod>) {
    for (policyPeriod in policyPeriods) {
      assertNoOpenPolicyTransactions(policyPeriod)
    }
  }

  public static function assertNoOpenPolicyTransactions(policyPeriod : PolicyPeriod) {
    var openPolicyTransactionExists = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#PolicyTerm, Relop.Equals, policyPeriod.PolicyTerm)
        .compareIn(PolicyPeriod#Status, PolicyPeriodStatus.TF_OPEN.TypeKeys.toTypedArray())
        .select()
        .getCountLimitedBy(1) > 0

    if (openPolicyTransactionExists) {
      throw new OpenPolicyTransactionBlockProgressException("Policy term ${policyPeriod.LevyYear_ACC} has an open policy transaction")
    }
  }
}