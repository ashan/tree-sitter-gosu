package nz.co.acc.er.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.ERSearchResultsCounter_ACC
uses nz.co.acc.er.ERUtils_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.Timestamp
uses java.sql.Types


class ERRunRequestSearchCriteria_ACC extends ERDatabaseController_ACC implements Serializable {

  private var _fromDate : Date as FromDate = DateUtil.currentDate().addYears(-1)
  private var _toDate : Date as ToDate = DateUtil.currentDate()
  private var _status : RequestStatus_ACC as Status
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERRunRequestSearchCriteria_ACC)

  function performSearch(rowCounter : ERSearchResultsCounter_ACC) : ERRunRequest_ACC[] {

    if(this.FromDate == null or this.ToDate == null) {
      throw new DisplayableException(DisplayKey.get("Web.Validation.ExperienceRating.ERRunRequest.SearchCriteria_ACC"))
    }
    rowCounter.TotalRows = 0

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.SearchClosedERRequests)
      stmt.setTimestamp(1, new Timestamp(ERUtils_ACC.getStartOfDate(this.FromDate).getTime()))
      stmt.setTimestamp(2, new Timestamp(ERUtils_ACC.getEndOfDate(this.ToDate).getTime()))
      if(this.Status.RequestStatusID != null) {
        stmt.setInt(3, this.Status.RequestStatusID)
      } else {
        stmt.setNull(3, Types.INTEGER)
      }
      stmt.setInt(4, (ScriptParameters.getParameterValue("ERSearchResultLimit_ACC") as Integer))
      executeQuery()

      var allRequests = new ArrayList<ERRunRequest_ACC>()
      while(rs.next()) {
        var runRequest = new ERRunRequest_ACC()
        runRequest.RequestID = rs.getInt("RequestID")
        runRequest.LevyYear = rs.getInt("LevyYear")
        var requestStatus = new RequestStatus_ACC()
        requestStatus.RequestStatusID = rs.getInt("RequestStatusID")
        requestStatus.Description = rs.getString("RequestStatusDescription")
        runRequest.RequestStatus = requestStatus
        var requestGroupType = new RequestGroupType_ACC()
        requestGroupType.RequestGroupTypeID = rs.getInt("RequestGroupTypeID")
        requestGroupType.Description = rs.getString("RequestGroupTypeDescription")
        runRequest.RequestGroupType = requestGroupType
        var requestType = new RequestType_ACC()
        requestType.RequestTypeID = rs.getInt("RequestTypeID")
        requestType.Description = rs.getString("RequestTypeDescription")
        runRequest.RequestType = requestType
        runRequest.CreatedDate = rs.getDate("RecordCreated")==null ? null : new Date(rs.getDate("RecordCreated").getTime())
        runRequest.Creator = rs.getString("RecordCreatedBy")
        runRequest.UpdatedDate = rs.getDate("RecordModified")==null ? null : new Date(rs.getDate("RecordModified").getTime())
        runRequest.UpdatedBy = rs.getString("RecordModifiedBy")
        runRequest.calculationTypeCode = rs.getString("CalculationTypeCode")
        var runId = rs.getInt("RunID")
        if(rs.wasNull()) {
          runRequest.RunID = null
        } else {
          runRequest.RunID = runId
        }
        if(runRequest.RunID != null) {
          var runDate = rs.getDate("RunDateTime")
          if(runDate != null) {
            runRequest.RunDate = new Date(runDate.getTime())
          }
        }
        runRequest.RatesApprovedBy = rs.getString("RatesApprovedBy")
        runRequest.RatesApprovedDate = rs.getDate("RatesApprovedDate")
        runRequest.ReviewRates = rs.getString("ReviewRates")
        runRequest.RatesSource = rs.getString("RatesSource")

        rowCounter.TotalRows = rs.getInt("totalrows")
        allRequests.add(runRequest)
      }
      return allRequests.toTypedArray()
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally {
      closeDbConnection()
    }
  }
}