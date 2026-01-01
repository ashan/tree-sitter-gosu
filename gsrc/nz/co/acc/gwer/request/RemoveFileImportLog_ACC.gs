package nz.co.acc.gwer.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.gwer.ERPersistenceUtil_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection


class RemoveFileImportLog_ACC implements Serializable {
  private static var _log = StructuredLogger.INTEGRATION.withClass(RemoveFileImportLog_ACC)

  function removeFileImportLog(fileType : int, filename : String) : void {

//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.RemoveFileImportLog)
//      stmt.setInt(1, fileType)
//      stmt.setString(2, filename)
//      executeStatement()
//
//      return
//    }
//    catch(e : Exception) {
//      _log.error_ACC(storeProcData.ProcName, e)
//      if(e typeis DisplayableException) {
//        throw e
//      }
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
//    }
//    finally {
//      closeDbConnection()
//    }
    return
  }
}