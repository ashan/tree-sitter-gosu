package nz.co.acc.er.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.Serializable
uses java.lang.invoke.MethodHandles
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet


class RequestReason_ACC extends ERDatabaseController_ACC implements Serializable {
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  private var _requestReasonID : Integer as RequestReasonID
  private var _sortOrder : Integer as SortOrder
  private var _requestReasonCode : String as RequestReasonCode
  private var _description : String as Description

  function retrieveAll() : RequestReason_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveAllERRequestReasonOptions)
      executeQuery()

      var allReasons = new ArrayList<RequestReason_ACC>()
      while(rs.next()) {
        var id = rs.getInt("RequestReasonID")
        var sortOrder = rs.getInt("SortOrder")
        var code = rs.getString("RequestReasonCode")
        var desc = rs.getString("RequestReasonDescription")
        var reason = new RequestReason_ACC()
        reason._requestReasonID = id
        reason._sortOrder = sortOrder
        reason._requestReasonCode = code
        reason._description = desc
        allReasons.add(reason)
      }
      return allReasons.toTypedArray()
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

  override function toString(): String {
    return this.Description
  }
}