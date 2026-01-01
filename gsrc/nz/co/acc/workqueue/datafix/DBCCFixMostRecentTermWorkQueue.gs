package nz.co.acc.workqueue.datafix

uses gw.api.database.InOperation
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC

/**
 * Data fix for Database Consistency Check issue JUNO-14473
 * <p>
 * Finds all Policies which have no PolicyTerm where MostRecentTerm=true
 * <p>
 * Sets MostRecentTerm=true for the latest/current PolicyTerm on the Policy.
 * <p>
 * Appears to only affect migrated accounts for AEP where policies were
 * rewritten to the AEP contract policy.
 * <p>
 * Author: Mike Ourednik
 */
class DBCCFixMostRecentTermWorkQueue extends WorkQueueBase<Policy, StandardWorkItem> {
  final var LOG = StructuredLogger_ACC.CONFIG.withClass(this)

  construct() {
    super(BatchProcessType.TC_DBCCFIXMOSTRECENTTERMWORKQUEUE_ACC, StandardWorkItem, Policy)
  }

  override function findTargets() : Iterator<Policy> {
    /*
    SELECT DISTINCT gRoot.ID col0
    FROM pc_policy gRoot
    INNER JOIN pc_policyterm policyterm_0 ON gRoot.ID = policyterm_0.PolicyID
    WHERE gRoot.Retired = 0
    AND policyterm_0.Bound = 1
    AND policyterm_0.Retired = 0
    AND NOT EXISTS (
      SELECT gRoot1.PolicyID col0
      FROM pc_policyterm gRoot1
      WHERE gRoot1.MostRecentTerm = 1
      AND gRoot1.PolicyID = policyterm_0.PolicyID
      AND gRoot1.Retired = 0
    )
    */
    LOG.info("Finding targets...")

    var subQuery = Query.make(PolicyTerm)
        .compare(PolicyTerm#MostRecentTerm, Relop.Equals, true)

    return Query.make(Policy)
        .join(PolicyTerm#Policy)
        .compare(PolicyTerm#Bound, Relop.Equals, true)
        .subselect(PolicyTerm#Policy, InOperation.CompareNotIn, subQuery, PolicyTerm#Policy)
        .withDistinct(true)
        .withLogSQL(true)
        .select()
        .iterator()
  }

  /**
   * Set MostRecentTerm=true for the latest/current PolicyTerm on the Policy
   *
   * @param item
   */
  override function processWorkItem(item : StandardWorkItem) {
    var policy = extractTarget(item)
    var currentLevyYear = Date.Now.LevyYear_ACC

    if (hasMostRecentTerm(policy)) {
      LOG.warn_ACC("Policy ${policy.PublicID} has a PolicyTerm where MostRecentTerm=true. Ignoring for DBCC fix.")
      return
    }

    var policyTerm = Query.make(PolicyTerm)
        .compare(PolicyTerm#Policy, Relop.Equals, policy)
        .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.LessThanOrEquals, currentLevyYear)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#AEPFinancialYear_ACC)))
        .thenByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#CreateTime)))
        .first()

    if (policyTerm != null) {
      LOG.info("Updating MostRecentTerm on PolicyTerm ${policyTerm.PublicID} for Policy ${policy.PublicID}")
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        policyTerm = bundle.add(policyTerm)
        policyTerm.setFieldValue("MostRecentTerm", true)
      })
    } else {
      LOG.info("PolicyTerm not found for Policy ${policy.PublicID}")
    }
  }

  function hasMostRecentTerm(policy : Policy) : boolean {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#Policy, Relop.Equals, policy)
        .compare(PolicyTerm#MostRecentTerm, Relop.Equals, true)
        .select()
        .HasElements
  }

}