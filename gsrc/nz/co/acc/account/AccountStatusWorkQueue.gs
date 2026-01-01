package nz.co.acc.account

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Updates status field for accounts that are flagged with StatusWorkQueuePending_ACC == true
 */
class AccountStatusWorkQueue extends WorkQueueBase<Account, StandardWorkItem> {
  final var _logger = StructuredLogger.CONFIG.withClass(this)

  construct() {
    super(BatchProcessType.TC_ACCOUNTSTATUSWORKQUEUE_ACC, StandardWorkItem, Account)
  }

  override function findTargets() : Iterator<Account> {
    if (not ScriptParameters.AccountStatusUpdateEnabled_ACC) {
      _logger.info("Work queue is disabled by script parameter AccountStatusUpdateEnabled_ACC set to false")
      return null
    }
    _logger.info("Finding targets...")
    var workItems = Query.make(Account)
        .compare(Account#StatusWorkQueuePending_ACC, Relop.Equals, true)
        .select()
    return workItems.iterator()
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var accountStatusEvaluator = new AccountStatusEvaluator()
    var account = extractTarget(workItem)
    var originalStatus = account.DisplayStatus_ACC
    var newStatus: String = null

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      account = bundle.add(account)
      accountStatusEvaluator.evaluateNewAccountStatus(account, Optional.empty())
      account.StatusWorkQueuePending_ACC = false
      newStatus = account.DisplayStatus_ACC
    })
    _logger.info("Updated account ${account.ACCID_ACC} status from ${originalStatus} to ${newStatus}")
  }

}