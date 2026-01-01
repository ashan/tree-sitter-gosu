package nz.co.acc.er.request

uses edge.util.helper.UserUtil
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.plugin.util.CurrentUserUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.databeans.RehabRiskMgmtRates_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC

uses java.io.Serializable
uses java.sql.Types


class ERRetrieveExpectedRehabRiskMgmtRates_ACC extends ERDatabaseController_ACC implements Serializable {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERRetrieveExpectedRehabRiskMgmtRates_ACC)

  function retrieveRiskMgmtRates_ACC(runID : Integer) : RehabRiskMgmtRates_ACC[] {

    var rehabRiskMgmtRates_ACC = new ArrayList<RehabRiskMgmtRates_ACC>()
    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveExpectedRehabRiskMgmtRates)
      stmt.setInt(1, runID)
      executeQuery()

      while(rs.next()) {
        var rehabRiskMgmtRates = new RehabRiskMgmtRates_ACC()
        rehabRiskMgmtRates.LRGCode = rs.getInt("LRGCode")
        rehabRiskMgmtRates.LRGDesc = rs.getString("LRGDesc")
        rehabRiskMgmtRates.LevyApplicationYear = rs.getInt("LevyApplicationYear")
        rehabRiskMgmtRates.LiableEarnings = rs.getBigDecimal("LiableEarnings")
        rehabRiskMgmtRates.CappedWCD = rs.getInt("CappedWCD")
        rehabRiskMgmtRates.MedicalSpendClaims = rs.getInt("MedicalSpendClaims")
        rehabRiskMgmtRates.ExpectedRehabMgmtRate = rs.getBigDecimal("ExpectedRehabMgmtRate")
        rehabRiskMgmtRates.ExpectedRiskMgmtRate = rs.getBigDecimal("ExpectedRiskMgmtRate")
        rehabRiskMgmtRates.ExperienceYear = rs.getInt("ExperienceYear")
        rehabRiskMgmtRates_ACC.add(rehabRiskMgmtRates)
      }
      return rehabRiskMgmtRates_ACC.toTypedArray()
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

  function updateRequestERLRGParams(requestID:int) : Boolean {
    var showLRGGrid = Boolean.TRUE

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.UpdateRequestERLRGParams)
      stmt.setInt(1, requestID)
      stmt.setString(2, CurrentUserUtil.CurrentUser.User.DisplayName)
      stmt.registerOutParameter(3, Types.VARCHAR)
      executeStatement()

      var errorMessage = stmt.getString("errorMsg")
      if(errorMessage != null) {
        throw new Exception(errorMessage)
      }

      showLRGGrid = Boolean.FALSE
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
    return showLRGGrid
  }
  override function toString(): String {
    return this.toString()
  }
}