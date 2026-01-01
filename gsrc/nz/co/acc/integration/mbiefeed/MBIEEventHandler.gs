package nz.co.acc.integration.mbiefeed

uses gw.api.database.Query
uses gw.api.database.Relop

uses nz.co.acc.integration.eventhubconsumer.IEventHandler_ACC
uses nz.co.acc.plm.integration.validation.nzbnvalidation.MBIEAPIClient
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Processes an NZBN notification.
 * <p>
 * Created by Mike Ourednik on 27/08/20.
 */
class MBIEEventHandler implements IEventHandler_ACC {

  private static var _log = StructuredLogger.INTEGRATION.withClass(MBIEEventHandler)
  var _mbieValidationClient: MBIEAPIClient
  var _mbieHelper = new MBIEHelper()

  construct(mbieValiadtionClient : MBIEAPIClient) {
    this._mbieValidationClient = mbieValiadtionClient
  }

  public function handleEvent(eventPayload : String) {

    if(_log.DebugEnabled){
      _log.debug( "eventPayload=${eventPayload}")
    }

    var nzbn = _mbieHelper.extractNZBNFromEvent(eventPayload)

    if (not _mbieValidationClient.isThirteenDigits(nzbn)) {
      _log.warn_ACC("nzbn=[${nzbn}] is not thirteen digits")
      return
    }

    var response = _mbieValidationClient.fetchData(nzbn)

    if (response.StatusCode == 200) {
      var accounts = findAccountsToUpdate(nzbn)

      _log.info("Found ${accounts.Count} account(s) to update for nzbn=${nzbn}")

      for (account in accounts) {
        updateAccount(account)
      }
      _mbieHelper.updateMaoriBusinessInfo(response.ResponseBody, nzbn)
    }
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