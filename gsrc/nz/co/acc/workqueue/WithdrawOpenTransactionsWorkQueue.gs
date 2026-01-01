package nz.co.acc.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.velocity.runtime.parser.LogContext

class WithdrawOpenTransactionsWorkQueue extends WorkQueueBase<PolicyPeriod, StandardWorkItem> {
  final var LOG = StructuredLogger.CONFIG.withClass(this)

  construct() {
    super(BatchProcessType.TC_WITHDRAWOPENTRANSACTIONS_ACC, StandardWorkItem, PolicyPeriod)
  }

  override function findTargets() : Iterator<PolicyPeriod> {
    var daysOld = ScriptParameters.WithdrawOpenTransactionsDaysOld_ACC
    if (daysOld == null) {
      throw new IllegalArgumentException("Script parameter WithdrawOpenTransactionsDaysOld=${daysOld} is null")
    }
    if (daysOld < 0) {
      throw new IllegalArgumentException("Script parameter WithdrawOpenTransactionsDaysOld=${daysOld} must be a non-negative number")
    }
    var endDate = Date.Now.addDays(-daysOld)
    LOG.info("Finding PolicyPeriods older than ${daysOld} days (UpdateTime <= ${endDate.toISOTimestamp()})...")

    return Query.make(PolicyPeriod)
        .compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_DRAFT, PolicyPeriodStatus.TC_QUOTED})
        .compare(PolicyPeriod#UpdateTime, Relop.LessThanOrEquals, endDate)
        .select()
        .iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    var policyPeriod = extractTarget(item)

    var policyPeriodString = getPolicyPeriodString(policyPeriod)

    if (openActivityExists(policyPeriod)) {
      LOG.info("Skipping PolicyPeriod with open activity: ${policyPeriodString}")
      return
    }

    if (policyPeriod.Locked) {
      LOG.info("Unlocking ${policyPeriodString}")
      unlockPolicyPeriod(policyPeriod)
      policyPeriod.refresh()
    }

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      var job = bundle.add(policyPeriod).Job
      LOG.info("Withdrawing Job {PublicID=${job.PublicID}} for ${policyPeriodString}")
      job.withdraw()
    })
  }

  private function getPolicyPeriodString(policyPeriod : PolicyPeriod) : String {
    return "PolicyPeriod {PublicID=${policyPeriod.PublicID}, PolicyNumber=${policyPeriod.PolicyNumber}, UpdateTime=${policyPeriod.UpdateTime.toISOTimestamp()}}"
  }

  private function openActivityExists(policyPeriod : PolicyPeriod) : Boolean {
    return Query.make(Activity)
        .compare(Activity#Policy, Relop.Equals, policyPeriod.Policy)
        .compare(Activity#Status, Relop.Equals, ActivityStatus.TC_OPEN)
        .select()
        .getCountLimitedBy(1) > 0
  }

  private function unlockPolicyPeriod(policyPeriod : PolicyPeriod) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      policyPeriod = bundle.add(policyPeriod)
      policyPeriod.unlock_ACC()
    })
  }

}