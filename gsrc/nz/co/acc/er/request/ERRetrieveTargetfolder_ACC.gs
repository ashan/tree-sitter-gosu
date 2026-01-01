package nz.co.acc.er.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper


uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet


class ERRetrieveTargetfolder_ACC extends ERDatabaseController_ACC implements Serializable {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERRetrieveTargetfolder_ACC)

  private static final var SQL_LOCATION_FIELD_NAME = "Value"

  private var _retrievedValue : String as RetrievedValue = ""

  function retrieveLocation() : String {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveTargetfolder)
      executeQuery()

      while(rs.next()) {
        this.RetrievedValue = rs.getString(SQL_LOCATION_FIELD_NAME)
      }
      return this.RetrievedValue
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
    return this.RetrievedValue
  }
}