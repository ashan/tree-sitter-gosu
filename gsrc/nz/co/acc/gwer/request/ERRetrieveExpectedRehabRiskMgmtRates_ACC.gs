package nz.co.acc.gwer.request

uses edge.util.helper.UserUtil
uses gw.api.database.IQueryBeanResult
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses gw.plugin.util.CurrentUserUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.gwer.databeans.RehabRiskMgmtRates_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC
uses gw.pl.persistence.core.Bundle
uses gw.api.database.Query
uses java.io.Serializable
uses java.math.BigDecimal
uses java.sql.Types


class ERRetrieveExpectedRehabRiskMgmtRates_ACC implements Serializable {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERRetrieveExpectedRehabRiskMgmtRates_ACC)

  function retrieveRiskMgmtRates_ACC(run : ERRun_ACC) : IQueryBeanResult<ERRehabRiskMgmtRates_ACC> {

    var rehabRiskQuery = Query.make(ERRehabRiskMgmtRates_ACC)
        rehabRiskQuery.compare(ERRehabRiskMgmtRates_ACC#ERRun, Relop.Equals, run)
    return rehabRiskQuery.select()
  }

  function updateRequestERLRGParams(request:ERRequest_ACC) : Boolean {
    var showLRGGrid = Boolean.TRUE
    var bundle = gw.transaction.Transaction.newBundle()

    return showLRGGrid
  }


  function removeExistingLRGParams(request : ERRequest_ACC, bundle : Bundle) {
    var lrgParamsResults = Query.make(ERLRGParametersValue_ACC)
                              .compare(ERLRGParametersValue_ACC#ExperienceYear, Relop.Equals, request.LevyYear)
                              .select()
    lrgParamsResults.each(\elt -> bundle.add(elt).remove())

    var run = Query.make(ERRun_ACC)
                        .compare(ERRun_ACC#ERRequest, Relop.Equals, request)
                        .select().FirstResult

    if(run != null) {
      var erRatesQuery = Query.make(ERRehabRiskMgmtRates_ACC)
                              .compare(ERRehabRiskMgmtRates_ACC#ERRun, Relop.Equals, run)
                              .select()
      erRatesQuery.each(\elt -> {
        var lrgParam = bundle.add(new ERLRGParametersValue_ACC())
        var paramLRG = Query.make(ERParamLRG_ACC)
                            .compare(ERParamLRG_ACC#LRGCode, Relop.Equals, elt.LRGCode)
                            .compare(ERParamLRG_ACC#LevyApplicationYear, Relop.Equals, elt.LevyApplicationYear)
                            .select().FirstResult
        lrgParam.ExperienceYear = request.LevyYear
        lrgParam.ERParamLRG = paramLRG
        lrgParam.ExpectedRehabMgmtRate_LgeEmp = elt.ExpectedRehabMgmtRate
        lrgParam.ExpectedRehabMgmtRate_MedEmp = elt.ExpectedRehabMgmtRate
        lrgParam.ExpectedRiskMgmtRate_LgeEmp = elt.ExpectedRiskMgmtRate
        lrgParam.ExpectedRiskMgmtRate_MedEmp = elt.ExpectedRiskMgmtRate
        lrgParam.IndustrySizeModifier_MedEmp = BigDecimal.ZERO
        lrgParam.IndustrySizeModifier_LgeEmp = BigDecimal.ZERO
        lrgParam.LRGRehabMgmtRate = BigDecimal.ZERO
      })
    }
  }
  override function toString(): String {
    return this.toString()
  }
}