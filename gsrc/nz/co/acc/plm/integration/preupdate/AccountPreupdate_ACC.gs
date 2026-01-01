package nz.co.acc.plm.integration.preupdate

uses nz.co.acc.account.AccountUtil
uses nz.co.acc.gna.PrimaryContactHistoryPreupdate
uses nz.co.acc.history.CustomHistoryHelper_ACC
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.plm.integration.apimgmt.events.CustomEvents
uses nz.co.acc.plm.integration.apimgmt.events.EventPredicates
uses nz.co.acc.plm.util.IRDACCNumberConverter
uses nz.co.acc.validforclaims.ValidForClaimsPreUpdate
uses nz.co.acc.validforclaims.ValidForClaimsUtil

/**
 * US2565
 * Created by RaithaJ on 20/04/2017.
 */
class AccountPreupdate_ACC {
  static final var _primaryContactPreupdateHistory = new PrimaryContactHistoryPreupdate()

  /**
   * US2565 : Jaykumar 20/04/2017
   * The rules for Account
   *
   * @param account
   */
  public static function executePreUpdate(account : Account) {
    // ignore process flags with no relevant field changes
    if (account.isFieldChanged(Account#StatusWorkQueuePending_ACC) and account.ChangedFields.Count == 1) {
      return
    }

    if (account.PreventReassessment_ACC == null) {
      account.PreventReassessment_ACC = false
    }
    // DE102 - Set the account's preferred coverage and settlement currency to NZD if it isn't already
    if (account.PreferredSettlementCurrency != Currency.TC_NZD) {
      account.PreferredSettlementCurrency = Currency.TC_NZD
    }
    if (account.PreferredCoverageCurrency != Currency.TC_NZD) {
      account.PreferredCoverageCurrency = Currency.TC_NZD
    }

    updateContactACCID(account)
    createIRProcessorKey(account)

    if (account.isFieldChanged(Account#PrimaryAccountContactID_ACC)) {
      account.addEvent(Account.ACCOUNTCHANGED_EVENT)
      account.addHistoryEvent(CustomHistoryType.TC_PRIMARY_CONTACT_CHANGED_ACC)
    }
    updateNonLiableFlag(account)
    raiseAPIMgmtCustomEvents(account)
    updateDerivedIRDNumber(account)
    updateHistory(account)
    _primaryContactPreupdateHistory.updatePrimaryContactHistoryIfChanged(account)
  }

  private static function createIRProcessorKey(account : Account) : void {
    if (account.New) {
      AccountUtil.createIRProccessorKey(account.ACCID_ACC, account.Bundle)
    }
  }

  public static function updateContactACCID(account : Account) {
    var accountHolderContact = account.AccountHolderContact
    if (accountHolderContact != null && accountHolderContact.ACCID_ACC == null) {
      account.AccountHolderContact.ACCID_ACC = account.ACCID_ACC
    }
  }

  private static function raiseAPIMgmtCustomEvents(account : Account) {
    if (account.New) {
      return
    }
    if (EventPredicates.check(account, EventPredicates.PREDICATE_ACCOUNT)) {
      account.addEvent(CustomEvents.INTEGRATION_APIMGMT_ACCOUNT_CHANGED)
    }
  }

  /**
   * update all valid for claims flags if Prevent Reassessment is set
   *
   * @param
   */
  private static function updateNonLiableFlag(account : Account) {
    if (account.isFieldChanged(Account#PreventReassessment_ACC)) {
      ValidForClaimsPreUpdate.onPreventReassessmentChanged(account.Bundle, account)
    }
    if (account.PreventReassessment_ACC) {
      account.RestrictedAccount_ACC = true
    }
  }

  private static function updateDerivedIRDNumber(account : Account) {
    if (account.ChangedFields.contains("ACCID_ACC")) {
      var derivedIRDNumber = IRDACCNumberConverter.instance.convertToIRDNumber(account.ACCID_ACC)
      var derivedACCID = AccountUtil.IRDNumberToACCNumber(derivedIRDNumber)
      if (!account.ACCID_ACC.equalsIgnoreCase(derivedACCID)) {
        account.IRDNumberDerived_ACC = null
      } else {
        account.IRDNumberDerived_ACC = derivedIRDNumber
      }
    }
  }

  private static function updateHistory(account : Account) {
    CustomHistoryHelper_ACC.writeAccountCustomHistory({
        "CorrespondencePreference_ACC",
        "StatusOfAccount_ACC"
    }, account)
  }
}