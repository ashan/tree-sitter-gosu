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


class ERRetrieveExpectedSpreadsheetTabs_ACC implements Serializable {

  private static final var SQL_LABEL_TAB_NAMES = "TabName"

  private var _retrievedValues : List<String> as RetrievedValues = new ArrayList<String>()
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERRetrieveExpectedSpreadsheetTabs_ACC)

  function retrieveSpreadsheetTabs(fileType : int) : List<String> {
    return null
//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.RetrieveParameterFileTabs)
//      stmt.setInt(1, fileType)
//      executeQuery()
//
//      while(rs.next()) {
//        this.RetrievedValues.add(rs.getString(SQL_LABEL_TAB_NAMES))
//      }
//      return this.RetrievedValues
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
  }


  override function toString(): String {
    return this.RetrievedValues.toString()
  }
}