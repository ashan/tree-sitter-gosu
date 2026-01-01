package nz.co.acc.gwer.batch

uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.api.database.Query
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses nz.co.acc.util.finder.FinderUtil_ACC

class ERSetLETermFlag_ACC extends WorkQueueBase<PolicyTerm, StandardWorkItem> {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERSetLETermFlag_ACC)
  construct () {
    super(BatchProcessType.TC_ERSETLETERMFLAG_ACC, StandardWorkItem, PolicyTerm)
  }

  override function findTargets(): Iterator<PolicyTerm> {
    var results = Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.GreaterThanOrEquals, ScriptParameters.ERStartLevyYear_ACC)
        .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.LessThanOrEquals, ScriptParameters.EREndLevyYear_ACC)
        .compare(PolicyTerm#HasLEorLevies_ACC, Relop.Equals, null)
        .select()

    return results.iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    var pt = extractTarget(item)
    var period = new FinderUtil_ACC().findLatestBoundOrAuditedPeriodER(pt)
    if(period != null) {
      var hasLEorLevies = new ERProcessUtils_ACC().HasLEorLevies(period)
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var policyTerm = bundle.add(period.PolicyTerm)
        policyTerm.HasLEorLevies_ACC = hasLEorLevies
        policyTerm.Cancelled_ACC = period.CancellationDate != null
        policyTerm.LatestBranchID_ACC = period.ID.Value
        policyTerm.LevyYear_ACC = period.LevyYear_ACC
        if(!policyTerm.ACCPolicyID_ACC.HasContent) {
          policyTerm.ACCPolicyID_ACC = period.ACCPolicyID_ACC
        }
        if(policyTerm.LevyYear_ACC == null) {
          policyTerm.LevyYear_ACC = period.LevyYear_ACC
        }
      })
    }
  }
}