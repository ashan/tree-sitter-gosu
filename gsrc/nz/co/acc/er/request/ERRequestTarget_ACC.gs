package nz.co.acc.er.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.Serializable
uses java.lang.invoke.MethodHandles
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.Types


class ERRequestTarget_ACC extends ERDatabaseController_ACC implements Serializable {

  private var _requestTargetID : Integer as RequestTargetID
  private var _requestID : Integer as RequestID
  private var _businessGroupId : Integer as BusinessGroupID
  private var _accPolicyId : String as ACCPolicyID
  private var _name : String as Name
  private var _requestReasonACC: RequestReason_ACC as RequestReason
  private var requestReasonDetails : String as RequestReasonDetails

  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  function create(conn2 : Connection) {
    conn = conn2
    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.CreateRequestTarget)
      stmt.setInt(1, this.RequestID)
      if(this.BusinessGroupID != null) {
        stmt.setInt(2, this.BusinessGroupID)
      } else {
        stmt.setNull(2, Types.INTEGER)
      }
      if(this.ACCPolicyID != null) {
        stmt.setString(3, this.ACCPolicyID)
      } else {
        stmt.setNull(3, Types.VARCHAR)
      }
      if(this.Name != null) {
        stmt.setString(4, this.Name)
      } else {
        stmt.setNull(4, Types.VARCHAR)
      }
      stmt.setInt(5, this.RequestReason.RequestReasonID)
      if(this.requestReasonDetails != null) {
        stmt.setString(6, this.requestReasonDetails)
      } else {
        stmt.setNull(6, Types.VARCHAR)
      }
      executeStatement()
    }
    catch (e: Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally{
      closeDbConnection()
    }
  }
}