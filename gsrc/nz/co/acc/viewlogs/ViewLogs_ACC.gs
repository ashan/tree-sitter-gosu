package nz.co.acc.viewlogs

uses gw.api.database.Query
uses gw.api.database.Relop

class ViewLogs_ACC {
  public static function logPolicyTermView(policyTerm : PolicyTerm) {
    var currentUser = User.util.CurrentUser
    if (canLog(currentUser, policyTerm.Policy.Account, policyTerm, null)) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var viewLog = new ViewLogs_ACC()
        viewLog.setLoggedUser(currentUser)
        viewLog.setTimestamp(Date.Now)
        viewLog.setPolicyTerm(policyTerm)
        viewLog.setAccount(policyTerm.Policy.Account)
      }, "sys")
    }
  }

  public static function logAccountView(account : Account) {
    var currentUser = User.util.CurrentUser
    if (canLog(currentUser, account, null, null)) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var viewLog = new ViewLogs_ACC()
        viewLog.setTimestamp(Date.Now)
        viewLog.setLoggedUser(currentUser)
        viewLog.setAccount(account)
      }, "sys")
    }

  }

  public static function logContactView(contact : Contact) {
    var currentUser = User.util.CurrentUser
    if (canLog(currentUser, null, null, contact)) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var viewLog = new ViewLogs_ACC()
        viewLog.setTimestamp(Date.Now)
        viewLog.setLoggedUser(currentUser)
        viewLog.setContact(contact)
      }, "sys")
    }

  }

  private static function canLog(user : User, account : Account, policyTerm : PolicyTerm, contact : Contact) : boolean {
    var tenMinsAgo = Date.Now.addMinutes(-10)
    var recentEntry = Query.make(ViewLogs_ACC)
        .compare(ViewLogs_ACC#LoggedUser, Relop.Equals, user?.ID)
        .compare(ViewLogs_ACC#Account, Relop.Equals, account?.ID)
        .compare(ViewLogs_ACC#Contact, Relop.Equals, contact?.ID)
        .compare(ViewLogs_ACC#PolicyTerm, Relop.Equals, policyTerm?.ID)
        .compare(ViewLogs_ACC#Timestamp, Relop.GreaterThan, tenMinsAgo)
        .select()
        .isEmpty()
    return recentEntry
  }
}