package nz.co.acc.workqueue

uses gw.api.database.InOperation
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.entity.IEntityType
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.account.AccountUtil

class CreateIRProcessorKeyWorkQueue_ACC extends WorkQueueBase<Account, StandardWorkItem> {
  final var LOG = StructuredLogger_ACC.INTEGRATION.withClass(this)
  final var PAGE_SIZE = 100000

  construct() {
    super(BatchProcessType.TC_CREATEIRPROCESSORKEYWORKQUEUE_ACC, StandardWorkItem, Account)
  }

  override function findTargets() : Iterator<Account> {
    var query = Query.make(Account)
        .subselect(Account#ACCID_ACC, InOperation.CompareNotIn, IRProcessorKey_ACC#ACCID)
        .select()

    query.setPageSize(PAGE_SIZE)

    LOG.info("Finished finding targets. Found ${query.Count} items to check")
    return query.iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    var account = extractTarget(item)
    LOG.info("Creating IRSeqeuncerKey for ACCID ${account.ACCID_ACC}")
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      AccountUtil.createIRProccessorKey(account.ACCID_ACC, bundle)
    })

  }
}