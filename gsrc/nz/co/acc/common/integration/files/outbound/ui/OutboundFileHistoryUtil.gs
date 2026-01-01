package nz.co.acc.common.integration.files.outbound.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths

/**
 * This is a util class for Outbound file run history UI
 * Created by zhangji on 16/12/2016.
 */
class OutboundFileHistoryUtil {

  public static function getOutboundFiles(): IQueryBeanResult<OutBoundHeader_ACC> {
    var query = Query.make(OutBoundHeader_ACC)
    var orderBy = QuerySelectColumns.path(Paths.make(entity.OutBoundHeader_ACC#CompletedTime))
    return (query.select().orderByDescending(orderBy) as IQueryBeanResult<OutBoundHeader_ACC>)
  }

  public static function findOutboundFileRecords(outboundFile: OutBoundHeader_ACC): IQueryBeanResult<OutBoundRecord_ACC> {
    var query = Query.make(OutBoundRecord_ACC).compare(OutBoundRecord_ACC#Header, Relop.Equals, outboundFile.ID)
    return query.select()
  }
}