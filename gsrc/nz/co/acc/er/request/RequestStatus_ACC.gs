package nz.co.acc.er.request

uses java.lang.invoke.MethodHandles
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses gw.surepath.suite.integration.logging.StructuredLogger



class RequestStatus_ACC extends ERDatabaseController_ACC {

  private var _requestStatusId : Integer as RequestStatusID
  private var _description : String as Description

  public static final var OPEN : Integer = 1
  public static final var APPROVED : Integer = 2
  public static final var DECLINED : Integer = 3
  public static final var WITHDRAWN : Integer = 4
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  function allClosedOptions() : RequestStatus_ACC[] {
    var allOptions = retrieveAll()
    var closedOptions = new ArrayList<RequestStatus_ACC> ()
    allOptions.each(\o -> {
      if(o.RequestStatusID != OPEN) {
        closedOptions.add(o)
      }
    })
    return closedOptions.toTypedArray()
  }

  function retrieveAll() : RequestStatus_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveAllERRequestStatusOptions)
      executeQuery()
      var statusList = new ArrayList<RequestStatus_ACC>()
      while(rs.next()) {
        var status = new RequestStatus_ACC()
        status._requestStatusId = rs.getInt("RequestStatusID")
        status._description = rs.getString("RequestStatusDescription")
        statusList.add(status)
      }
      return statusList.toTypedArray()
    } catch(e : Exception) {
      _logger.error_ACC( "getClosedOptions", e)
      return {}
    } finally {
      closeDbConnection()
    }
  }

  override function toString(): String {
    return this.Description
  }
}