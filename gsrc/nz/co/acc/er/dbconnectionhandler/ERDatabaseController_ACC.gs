package nz.co.acc.er.dbconnectionhandler

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.suppressionlists.SuppressionListSearchCriteria_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.SQLException

/**
 * Created by andy on 25/09/2017.
 */
class ERDatabaseController_ACC implements Serializable{
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERDatabaseController_ACC)

  protected var conn: Connection = null
  protected var stmt: CallableStatement = null
  protected var rs: ResultSet = null
  protected var storeProcData : StoreProcNames_ACC = null
  protected var _searchCriteria : SuppressionListSearchCriteria_ACC as SearchCriteria = new SuppressionListSearchCriteria_ACC()

  construct() {
  }


  /**
   * Create the database connection.
   */
  function makeDbConnection() {
    conn = null
    stmt = null
    rs = null

    try {
      conn = new ERDatabaseConnectionHelper().Connection
    }
    catch(e : SQLException){
      _logger.error_ACC("NoERDatabaseAvailable", e)
      closeDbConnection()
      throw new DisplayableException(DisplayKey.get("Web.Experiencerating.DatabaseConnection.NoERDatabase"))
    }
  }


  /**
   * Create the Statement ready for population
   * @param storeProcName
   */
  function createDbStatement( storeProcName : StoreProcNames_ACC) {
    // Save this for later
    this.storeProcData = storeProcName

    try {
      stmt = conn.prepareCall(storeProcName.getProcConnectionString())
    }
    catch(e : SQLException){
      _logger.error_ACC(storeProcName.ProcName, e)
      closeDbConnection()
      throw new DisplayableException(DisplayKey.get("Web.Experiencerating.DatabaseConnection.Invalid.StoreProc"))
    }
  }


  /**
   * Create a new Search Criteria
   * @return
   */
  function createCriteria(): SuppressionListSearchCriteria_ACC {
    _searchCriteria = new SuppressionListSearchCriteria_ACC()
    return _searchCriteria
  }


  /**
   * Run the statement as a Query
   */
  function executeQuery() {

    try {
      _logger.info("Query string ${stmt.toString()}")
      rs = stmt.executeQuery()
    }
    catch(e : ArrayIndexOutOfBoundsException) {
      _logger.error_ACC(storeProcData.ProcName, e)
    }
    catch(e : SQLException) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if (e.getErrorCode() > 99500 and e.getErrorCode() < 99700) {
        throw StoreProcErrorCodes_ACC.getDisplayableException(e.getErrorCode())
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Sql.Error_ACC", this.storeProcData.ProcName))
    }
  }


  /**
   * Run the statement as a Query
   */
  function executeStatement() {

    try {
      stmt.execute()
    }
    catch(e : ArrayIndexOutOfBoundsException) {
      _logger.error_ACC(storeProcData.ProcName, e)
    }
    catch(e : SQLException) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if (e.getErrorCode() > 99500 and e.getErrorCode() < 99700) {
        throw StoreProcErrorCodes_ACC.getDisplayableException(e.getErrorCode())
      }
      if (e.getSQLState().equals("S0001") or e.ErrorCode==4060)  {
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Sql.Error_ACC", this.storeProcData.ProcName))
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Sql.Error_ACC", this.storeProcData.ProcName))
    }
  }


  /**
   * Close all the DB Connections
   */
  function closeDbConnection() {
    ERPersistenceUtil_ACC.closeResultSet(rs, this)
    ERPersistenceUtil_ACC.closeStatement(stmt, this)
    ERPersistenceUtil_ACC.closeConnection(conn, this)
  }
}