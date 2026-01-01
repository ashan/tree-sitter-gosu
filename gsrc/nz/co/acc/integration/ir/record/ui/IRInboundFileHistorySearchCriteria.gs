package nz.co.acc.integration.ir.record.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths

uses java.io.Serializable

class IRInboundFileHistorySearchCriteria implements Serializable {

  function performSearch() : IQueryBeanResult<IRInboundFileHistory_ACC> {
    var orderBy = QuerySelectColumns.path(Paths.make(IRInboundFileHistory_ACC#CreateTime))

    var query = buildQuery() as Query<IRInboundFileHistory_ACC>

    return query.select()
        .orderByDescending(orderBy) as IQueryBeanResult<IRInboundFileHistory_ACC>
  }

  function buildQuery() : Query {
    return Query.make(IRInboundFileHistory_ACC)
  }

}