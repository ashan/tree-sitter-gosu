package nz.co.acc.gna

uses gw.api.util.DateUtil

class PrimaryContactHistoryPreupdate {

  public function updatePrimaryContactHistoryIfChanged(account : Account) {
    if (account.isFieldChanged(account#PrimaryAccountContactID_ACC)) {
      updatePrimaryContactHistory(account, DateUtil.currentDate())
    }
  }

  private function updatePrimaryContactHistory(account : Account, updateTime : Date) {
    var contact = account.PrimaryContact_ACC
    var bundle = account.Bundle
    var historyEntry = new PrimaryContactHistory_ACC(bundle)
    historyEntry.Account = account
    historyEntry.PrimaryContact = contact
    historyEntry.UpdateTime = updateTime
  }
}