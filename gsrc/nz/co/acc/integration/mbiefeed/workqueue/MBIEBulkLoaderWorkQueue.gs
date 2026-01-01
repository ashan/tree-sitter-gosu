package nz.co.acc.integration.mbiefeed.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop

uses gw.processes.WorkQueueBase

uses nz.co.acc.integration.mbiefeed.MBIEHelper
uses nz.co.acc.plm.integration.validation.nzbnvalidation.MBIEAPIClient
uses gw.surepath.suite.integration.logging.StructuredLogger

@Export
class MBIEBulkLoaderWorkQueue extends WorkQueueBase<Account, StandardWorkItem> {
  final var PAGE_SIZE = 100000
  private static var _log = StructuredLogger.INTEGRATION.withClass(MBIEBulkLoaderWorkQueue)
  private var mbieHelper = new MBIEHelper();

  construct() {
    super(BatchProcessType.TC_MBIEBULKLOADER_ACC, StandardWorkItem, Account)
  }

  override function processWorkItem(item : StandardWorkItem) {
    var account = extractTarget(item)
    var response = MBIEAPIClient.getInstance().fetchData(account.IRNZBN_ACC)

    if (response.StatusCode == 200) {
      var accounts = findAccountsToUpdate(account.IRNZBN_ACC)
      _log.info("Found ${accounts.Count} account(s) to update for nzbn=${account.IRNZBN_ACC}")
      for (acc in accounts) {
        updateAccount(acc)
      }
      mbieHelper.updateMaoriBusinessInfo(response.ResponseBody, account.IRNZBN_ACC)
    } else {
      _log.info("Could not find valid NZBN: ${account.IRNZBN_ACC}")
    }
  }

  override function findTargets() : Iterator<Account> {
    _log.info("Selecting all accounts ...")
    var query = Query.make(Account)
        .compare(Account#IRNZBN_ACC, Relop.NotEquals, null)
        .select()
    query.setPageSize(PAGE_SIZE)
    return query.iterator()
  }

  private function findAccountsToUpdate(nzbn : String) : List<Account> {
    return Query.make(Account)
        .compare(Account#IRNZBN_ACC, Relop.Equals, nzbn)
        .and(\r1 -> {
          r1.or(\r2 -> {
            r2.compare(Account#NZBN_ACC, Relop.Equals, null)
            r2.compare(Account#NZBN_ACC, Relop.NotEquals, nzbn)
          })
        })
        .select()
        .toList()
  }

  private function updateAccount(account : Account) {
    _log.info("Updating account ${account.ACCID_ACC}")
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      account = b.add(account)
      account.NZBN_ACC = account.IRNZBN_ACC
    })
  }

}