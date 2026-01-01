package nz.co.acc.migration.gx.base.account

enhancement AccountEnhancement_ACC: entity.Account {
  /**
   * Retrieve all history for account
   */
  property get AllHistory(): List <History> {
    var historySearch = new gw.history.HistorySearchCriteria(){: RelatedItem = this}
    var results = historySearch.performSearch()
    return results.Empty ? null : results.toList()
  }


}
