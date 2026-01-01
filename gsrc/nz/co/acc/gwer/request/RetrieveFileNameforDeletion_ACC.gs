package nz.co.acc.gwer.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.gwer.ERPersistenceUtil_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.Serializable
uses java.lang.invoke.MethodHandles
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.Types


class RetrieveFileNameforDeletion_ACC implements Serializable {

  private static final var SQL_LABEL_UNIQUE_FILE_NAME_OUT = "UniqueFilename_Out"
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  private var _retrievedValue : String as RetrievedValue = ""

  function retrieveFileNameforDeletion(fileType : int) : String {

//
//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.RetrieveFileName)
//      stmt.setInt(1, fileType)
//      stmt.registerOutParameter(2, Types.VARCHAR)
//      executeStatement()
//
//      RetrievedValue = stmt.getString(SQL_LABEL_UNIQUE_FILE_NAME_OUT)
//
//      return RetrievedValue
//    }
//    catch(e : Exception) {
//      _logger.error_ACC(storeProcData.ProcName, e)
//      if(e typeis DisplayableException) {
//        throw e
//      }
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
//    }
//    finally {
//      closeDbConnection()
//    }
    return RetrievedValue
  }

  override function toString(): String {
    return RetrievedValue
  }
}