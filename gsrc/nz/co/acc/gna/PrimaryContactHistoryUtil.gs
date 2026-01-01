package nz.co.acc.gna

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths

class PrimaryContactHistoryUtil {
  function getLatestPrimaryContactAt(account : Account, timestamp : Date) : Contact {
    var result = Query.make(PrimaryContactHistory_ACC)
        .compare(PrimaryContactHistory_ACC#UpdateTime, Relop.LessThan, timestamp)
        .compare(PrimaryContactHistory_ACC#Account, Relop.Equals, account)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(PrimaryContactHistory_ACC#UpdateTime)))
        .first()
        ?.PrimaryContact

    if(result == null){
      result = account.AccountHolderContact
    }
    return result
  }
}