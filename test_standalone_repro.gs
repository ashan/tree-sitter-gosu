uses gw.api.database.Query
uses gw.api.database.Relop

class StandAloneBillingSystemPlugin {
  override function searchForAccounts(searchCriteria : BillingAccountSearchCriteriaJava, p1 : Integer) : BillingAccountSearchResult[] {
    if (searchCriteria typeis BillingAccountSearchCriteria and searchCriteria.AccountNumber != null) {
      if (!searchCriteria.ListBill) {
        var localAccountQuery = Query.make(Account)
        localAccountQuery.compare(Account.ACCID_ACC_PROP.get(), Relop.Equals, searchCriteria.AccountNumber)
        // ...
      }
    }
  }
}
