package nz.co.acc.er.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet

class RequestDecision_ACC extends ERDatabaseController_ACC implements Serializable {

  private static var _logger = StructuredLogger.INTEGRATION.withClass(RequestDecision_ACC)

  private var _requestDecisionID : Integer as RequestDecisionID
  private var _description : String as Description

  public static final var APPROVED : Integer = 1
  public static final var DECLINED : Integer = 2

  function getDecisionOptions() : RequestDecision_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveAllERRequestDecisionOptions)
      executeQuery()

      var decisionList = new ArrayList<RequestDecision_ACC>()
      while(rs.next()) {
        var decision = new RequestDecision_ACC()
        decision._requestDecisionID = rs.getInt("RequestDecisionID")
        decision._description = rs.getString("RequestDecisionDescription")
        decisionList.add(decision)
      }
      return decisionList.toTypedArray()
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