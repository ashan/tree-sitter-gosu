uses gw.api.database.Query
uses gw.api.database.Relop

class StandAloneBillingSystemPlugin {
  private property get COMMISSION_PLAN_SUMMARIES() : List<CommissionPlanSummary> {
    return null
  }

  override function searchForAccounts(searchCriteria : BillingAccountSearchCriteriaJava, p1 : Integer) : BillingAccountSearchResult[] {
     localAccountQuery.compare(Account.ACCID_ACC_PROP.get(), Relop.Equals, searchCriteria.AccountNumber)
  }
}
