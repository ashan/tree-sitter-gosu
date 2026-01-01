uses gw.api.database.Query
uses gw.api.database.Relop

class StandAloneBillingSystemPlugin {
  override function searchForAccounts(searchCriteria : BillingAccountSearchCriteriaJava, p1 : Integer) : BillingAccountSearchResult[] {
    var localAccountQuery = Query.make(Account)
    localAccountQuery.compare(Account.ACCID_ACC_PROP.get(), Relop.Equals, searchCriteria.AccountNumber)
    var results = createSearchResultFromActualAccounts(localAccountQuery.select().toTypedArray() as Account)
    return null
  }
}
