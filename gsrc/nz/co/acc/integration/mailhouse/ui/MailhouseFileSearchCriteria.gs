package nz.co.acc.integration.mailhouse.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths

uses java.io.Serializable

class MailhouseFileSearchCriteria implements Serializable {

  function performSearch() : IQueryBeanResult<MailhouseFile_ACC> {
    var orderBy = QuerySelectColumns.path(Paths.make(MailhouseFile_ACC#CreateTime))

    var query = buildQuery() as Query<MailhouseFile_ACC>

    return query.select()
        .orderByDescending(orderBy) as IQueryBeanResult<MailhouseFile_ACC>
  }

  function buildQuery() : Query {
    return Query.make(MailhouseFile_ACC)
  }

}