package nz.co.acc.accountcontact

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.account.AccountStatusEvaluator
uses entity.Contact

/**
 * Updates status field for accounts that are flagged with StatusWorkQueuePending_ACC == true
 */
class AccountContactCorrespondencePreferenceWorkQueue_ACC extends WorkQueueBase<Account, StandardWorkItem> {
  final var _logger = StructuredLogger.CONFIG.withClass(this)

  construct() {
    super(BatchProcessType.TC_CONTACTCORRESPONDENCEPREFERENCEWORKQUEUE_ACC, StandardWorkItem, Account)
  }

  override function findTargets() : Iterator<Account> {
    _logger.info("Finding targets...")

    var accountQuery = Query.make(Account)
    var accountHolderContactQuery = accountQuery.join(Account#AccountHolderContact)
    var workItems = accountQuery.compare(Account#CorrespondencePreference_ACC, Relop.NotEquals, null)
        .compare(Account#CorrespondencePreference_ACC,Relop.NotEquals, accountHolderContactQuery.getColumnRef("CorrespondencePreference_ACC"))
        .withLogSQL(true)
        .select()

    workItems.setPageSize(100000)

    return workItems.iterator()
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var account = extractTarget(workItem)
    var correspondencePreference = account.CorrespondencePreference_ACC
    var accountHolderContact = account.AccountHolderContact

    if (accountHolderContact.CorrespondencePreference_ACC != account.CorrespondencePreference_ACC) {
      try {
        gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
          accountHolderContact = bundle.add(accountHolderContact)
          accountHolderContact.setCorrespondencePreference_ACC(correspondencePreference)
        })
        _logger.info("Updated contact ${accountHolderContact.ID} to have correspondence preference ${correspondencePreference}, for account ${account.ACCID_ACC}")
      } catch (e : Exception) {
        _logger.error_ACC("Failed to update the account holder contacts correspondence Preference for contact ${accountHolderContact.ID}, for account ${account.ACCID_ACC}", e)
      }
    }

  }

}