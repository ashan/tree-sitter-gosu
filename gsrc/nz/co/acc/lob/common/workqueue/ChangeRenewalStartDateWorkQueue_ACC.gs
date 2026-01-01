package nz.co.acc.lob.common.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.DateUtil
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.lob.common.DateUtil_ACC

uses java.text.SimpleDateFormat

/**
 * Created by manubaf on 20/12/2019.
 */
class ChangeRenewalStartDateWorkQueue_ACC extends WorkQueueBase<PolicyTerm, StandardWorkItem> {
  private static var _logger = StructuredLogger.CONFIG.withClass(ChangeRenewalStartDateWorkQueue_ACC)
  construct () {
    super(BatchProcessType.TC_CHANGERENEWALSTARTDATEWORKQUEUE_ACC, StandardWorkItem, PolicyTerm)
  }

  override function findTargets(): Iterator<PolicyTerm> {
    _logger.info("Starting TC_ChangeRenewalStartDateWorkQueue_ACC")
    var ptQuery = Query.make(PolicyTerm)
    var ppQuery = ptQuery.join(PolicyPeriod#PolicyTerm)
        ppQuery.compare(PolicyPeriod#LevyYear_ACC, Relop.Equals, DateUtil_ACC.getCurrentLevyYear())
    ptQuery.withDistinct(true)
    var results = ptQuery.select()
    _logger.debug("PolicyTerm count : " + results.Count)
    return results.iterator()
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var policyTerm = extractTarget(workItem)
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var nPolicyTerm = bundle.add(policyTerm)
      nPolicyTerm.setNextRenewalCheckDate(DateUtil.createDateInstance(04, 01, DateUtil_ACC.getCurrentLevyYear()).addDays(ScriptParameters.getParameterValue("MaxAllowedDaysForPRD_ACC") as int))
    })
  }
}