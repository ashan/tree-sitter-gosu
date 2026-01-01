package nz.co.acc.gwer.request

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.gwer.ERPersistenceUtil_ACC
uses nz.co.acc.gwer.ERSearchResultsCounter_ACC
uses nz.co.acc.gwer.ERUtils_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.Timestamp
uses java.sql.Types


class ERRunRequestSearchCriteria_ACC implements Serializable {

  private var _fromDate : Date as FromDate = DateUtil.currentDate().addYears(-1)
  private var _toDate : Date as ToDate = DateUtil.currentDate()
  private var _status : ERRequestStatus_ACC as Status
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERRunRequestSearchCriteria_ACC)

  function performSearch(rowCounter : ERSearchResultsCounter_ACC) : IQueryBeanResult<ERRequest_ACC> {

    if(this.FromDate == null or this.ToDate == null) {
      throw new DisplayableException(DisplayKey.get("Web.Validation.ExperienceRating.ERRunRequest.SearchCriteria_ACC"))
    }
    rowCounter.TotalRows = 0

    try {
      var requestQuery = Query.make(ERRequest_ACC)
        requestQuery.compare(ERRequest_ACC#CreateTime, Relop.GreaterThanOrEquals, this.FromDate.trimToMidnight())
        requestQuery.compare(ERRequest_ACC#CreateTime, Relop.LessThanOrEquals, this.ToDate.addDays(1).trimToMidnight())
      if(this.Status != null) {
        requestQuery.compare(ERRequest_ACC#ERRequestStatus, Relop.Equals, this.Status)
      } else {
        requestQuery.compareIn(ERRequest_ACC#ERRequestStatus, ERRequestStatus_ACC.TF_NONOPEN.TypeKeys.toTypedArray())
      }

      return requestQuery.select()
    }
    catch(e : Exception) {
      _logger.error_ACC(e.getMessage())
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", "ERRequest"))
    }
  }
}