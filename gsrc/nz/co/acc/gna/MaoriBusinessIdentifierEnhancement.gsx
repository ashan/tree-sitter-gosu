package nz.co.acc.gna

uses gw.api.database.Query
uses gw.api.database.Relop

enhancement MaoriBusinessIdentifierEnhancement : MaoriBusinessInfo_ACC {
  function getRelatedAccounts() : List<Account>{
    var accounts = Query.make(Account).compare(Account#NZBN_ACC, Relop.Equals, this.NZBN).select().toList()
    return accounts
  }
}
