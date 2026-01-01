package nz.co.acc.gwer.batch

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses nz.co.acc.gwer.ERRunParameter
uses nz.co.acc.gwer.ERRunExperienceLEandLevy
uses nz.co.acc.gwer.ERRunExperienceClaims
uses gw.pl.currency.MonetaryAmount
uses java.math.BigDecimal

class ERPreCalcLRGComp_ACC extends WorkQueueBase<ERRunCalcResult_ACC, StandardWorkItem> {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERPreCalcLRGComp_ACC)
  private var _erProcessUtils : ERProcessUtils_ACC
  construct () {
    super(BatchProcessType.TC_ERPRECALCLRGCOMP_ACC, StandardWorkItem, ERRunCalcResult_ACC)
    this._erProcessUtils = new ERProcessUtils_ACC()
  }

  override function findTargets(): Iterator<ERRunCalcResult_ACC> {
    var queryRunCalcResult = Query.make(ERRunCalcResult_ACC)
        .compare(ERRunCalcResult_ACC#ERProgramme, Relop.NotEquals, ERProgramme_ACC.TC_STD)
    queryRunCalcResult.join(ERRunCalcResult_ACC#ERRun)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
    return queryRunCalcResult.select().iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    try {
      var runCalcResult = extractTarget(item)
      var erRunParam = new ERRunParameter(runCalcResult.ERRun.ERRequest.LevyYear)
      var listExpYears = _erProcessUtils.getTargetYears(erRunParam, Boolean.FALSE)
      var source = runCalcResult.ERBusinessGroup != null ? runCalcResult.ERBusinessGroup.BusinessGroupID : runCalcResult.ACCPolicyID_ACC

      // for ER Only - createERRunCalcLRGComp to store LE & Levy per LRG Code
      if (runCalcResult.ERProgramme == ERProgramme_ACC.TC_ER) {
        var lrgAggregatedLEandLevy = _erProcessUtils.getLRGAggregatedLEandLevy(runCalcResult)
        if(lrgAggregatedLEandLevy.HasElements) {
//          var expLEandLevy = ArrayList<ERRunExperienceLEandLevy>()
          var mapExpLEandLevy = new HashMap<ERParamLRG_ACC, ERRunExperienceLEandLevy>();
          for (row in lrgAggregatedLEandLevy) {
            var sumLiableEarnings = new MonetaryAmount(row.getColumn("SumLiableEarnings") as BigDecimal, Currency.TC_NZD)
            var sumLevyDue = new MonetaryAmount(row.getColumn("SumLevyDue") as BigDecimal, Currency.TC_NZD)
            var erParamLRG = Query.make(ERParamLRG_ACC)
                .compare(ERParamLRG_ACC#ID, Relop.Equals, row.getColumn("ERParamLRG"))
                .select().FirstResult
            var levyYear = row.getColumn("LevyYear") as Integer

            var expLEandLevy : ERRunExperienceLEandLevy
            if (mapExpLEandLevy.containsKey(erParamLRG)) {
              expLEandLevy = mapExpLEandLevy.get(erParamLRG)
            } else {
              expLEandLevy = new ERRunExperienceLEandLevy()
            }

            for (expYr in listExpYears index i) {
              if (i == 0 && expYr == levyYear) {
                expLEandLevy.expYearYr1 = levyYear
                expLEandLevy.liableEarningsYr1 = sumLiableEarnings
                expLEandLevy.levyDueYr1 = sumLevyDue
              } else if (i == 1 && expYr == levyYear) {
                expLEandLevy.expYearYr2 = levyYear
                expLEandLevy.liableEarningsYr2 = sumLiableEarnings
                expLEandLevy.levyDueYr2 = sumLevyDue
              } else if (i == 2 && expYr == levyYear) {
                expLEandLevy.expYearYr3 = levyYear
                expLEandLevy.liableEarningsYr3 = sumLiableEarnings
                expLEandLevy.levyDueYr3 = sumLevyDue
              }
            }
            mapExpLEandLevy.put(erParamLRG, expLEandLevy)
          }

          for (curParamLRG in mapExpLEandLevy.Keys) {
            _erProcessUtils.createERRunCalcLRGComp(runCalcResult, curParamLRG, mapExpLEandLevy.get(curParamLRG))
            _logger.info("ER with aggregated levies ${source} ERRunCalcLRGComp_ACC created")
          }
        } else {
          _logger.info("ER with no aggregated levies ${source}")
        }
      }

      // for ER or NCD - updateERRunCalcResultClaimData
      var lrgAggregatedClaims = _erProcessUtils.getLRGAggregatedClaims(runCalcResult)
      if (lrgAggregatedClaims.HasElements) {
        var mapExpClaims = new HashMap<ERParamLRG_ACC, ERRunExperienceClaims>();
        for (row in lrgAggregatedClaims) {
          var sumIsFatal = row.getColumn("SumIsFatal") as Integer
          var sumMedicalSpend = row.getColumn("SumMedicalSpend") as BigDecimal
          var sumIsRiskMgmtQ = row.getColumn("SumIsRiskMgmtQ") as Integer
          var sumExceedsMSTH = row.getColumn("SumExceedsMSTH") as Integer
          var sumCappedWCD = row.getColumn("SumCappedWCD") as BigDecimal
          var sumIncludeInFactor = row.getColumn("SumIncludeInFactor") as Integer
          var erParamLRG = Query.make(ERParamLRG_ACC)
              .compare(ERParamLRG_ACC#ID, Relop.Equals, row.getColumn("ERParamLRG"))
              .select().FirstResult
          var levyYear = row.getColumn("LevyYear") as Integer

          var expClaims : ERRunExperienceClaims
          if (mapExpClaims.containsKey(erParamLRG)) {
            expClaims = mapExpClaims.get(erParamLRG)
          } else {
            expClaims = new ERRunExperienceClaims()
          }

          for (expYr in listExpYears index i) {
            if (i == 0 && expYr == levyYear) {
              expClaims.expYearYr1 = levyYear
              expClaims.isFatalTotalYr1 = sumIsFatal
              expClaims.riskMgmtClaimsTotalYr1 = sumIsRiskMgmtQ
              expClaims.wcdTotalYr1 = sumCappedWCD
              expClaims.includeInFactorYr1 = sumIncludeInFactor
            } else if (i == 1 && expYr == levyYear) {
              expClaims.expYearYr2 = levyYear
              expClaims.isFatalTotalYr2 = sumIsFatal
              expClaims.riskMgmtClaimsTotalYr2 = sumIsRiskMgmtQ
              expClaims.wcdTotalYr2 = sumCappedWCD
              expClaims.includeInFactorYr2 = sumIncludeInFactor
            } else if (i == 2 && expYr == levyYear) {
              expClaims.expYearYr3 = levyYear
              expClaims.isFatalTotalYr3 = sumIsFatal
              expClaims.riskMgmtClaimsTotalYr3 = sumIsRiskMgmtQ
              expClaims.wcdTotalYr3 = sumCappedWCD
              expClaims.includeInFactorYr3 = sumIncludeInFactor
            }
          }
          mapExpClaims.put(erParamLRG, expClaims)
        }

        var isFatalTotal : Integer = 0
        var wcdTotal = BigDecimal.ZERO
        var includeInFactorYr1 : Integer = 0
        var includeInFactorYr2 : Integer = 0
        var includeInFactorYr3 : Integer = 0
        for (curParamLRG in mapExpClaims.Keys) {
          var claimLRG = mapExpClaims.get(curParamLRG)
          if(claimLRG != null) {
            // for ER Only - updateERRunCalcLRGComp to store Claims per LRG Code
            if (runCalcResult.ERProgramme == ERProgramme_ACC.TC_ER) {
              _logger.info("ER ${source} updated ERRunCalcLRGComp_ACC")
              _erProcessUtils.updateERRunCalcLRGComp(runCalcResult, curParamLRG, claimLRG)

              // set claim level IncludeInFactor to 1 if one or more LRG level IncludeInFactor is 1
              if (claimLRG.includeInFactorYr1 > 0)
                includeInFactorYr1 = 1
              if (claimLRG.includeInFactorYr2 > 0)
                includeInFactorYr2 = 1
              if (claimLRG.includeInFactorYr3 > 0)
                includeInFactorYr3 = 1
            }

            _logger.info("ER ${source} updateERRunCalcResultClaimData")
            isFatalTotal = _erProcessUtils.sumIntegerArray({isFatalTotal, claimLRG.isFatalTotalYr1,
                claimLRG.isFatalTotalYr2, claimLRG.isFatalTotalYr3})
            wcdTotal = _erProcessUtils.sumDecimalArray({
                wcdTotal,
                claimLRG.wcdTotalYr1,
                claimLRG.wcdTotalYr2,
                claimLRG.wcdTotalYr3
            })
          } else {
            _logger.info("claims LRG is null")
          }
        }

        _logger.info("ER ${source} updateERRunCalcResultClaimData")
        _erProcessUtils.updateERRunCalcResultClaimData(runCalcResult, isFatalTotal, wcdTotal, includeInFactorYr1, includeInFactorYr1, includeInFactorYr1)

      } else {
        _logger.info("ER ${source} no claims data")
      }
    } catch (e:Exception) {
      _logger.error_ACC("processWorkItem::" + e.Message, e)
      e.printStackTrace()
      throw e
    }
  }

  class ClaimIncludeInFactors {
    public var expYear1 : Integer
    public var expYear2 : Integer
    public var expYear3 : Integer
  }
}
