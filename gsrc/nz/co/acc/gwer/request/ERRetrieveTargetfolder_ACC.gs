package nz.co.acc.gwer.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.gwer.ERPersistenceUtil_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper


uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet


class ERRetrieveTargetfolder_ACC implements Serializable {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERRetrieveTargetfolder_ACC)

  private static final var SQL_LOCATION_FIELD_NAME = "Value"

  private var _retrievedValue : String as RetrievedValue = ""

  function retrieveLocation() : String {

//
    return this.RetrievedValue
  }


  override function toString(): String {
    return this.RetrievedValue
  }
}