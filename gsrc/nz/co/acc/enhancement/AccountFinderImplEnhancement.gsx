package nz.co.acc.enhancement

uses gw.api.database.Query
uses gw.api.domain.account.AccountFinder
uses gw.pl.util.ArgCheck


enhancement AccountFinderImplEnhancement : AccountFinder {

  public function findAccountByACCID(accID : String) : Account {
    ArgCheck.nonNull(accID, "accID")
    return Query.make(Account)
        .compare(Account#ACCID_ACC, Equals, accID.trim())
        .select()
        .FirstResult
  }

}
