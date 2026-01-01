package nz.co.acc.gwer.batch

uses gw.api.database.InOperation
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses nz.co.acc.gwer.ERRunParameter
uses nz.co.acc.gwer.ERRunValidationCounter
uses nz.co.acc.gwer.ERRunExperienceLEandLevy
uses gw.pl.currency.MonetaryAmount
uses java.math.BigDecimal

class ERDetermineNCDEligibility_ACC extends WorkQueueBase<ERRunPolicyGroup_ACC, StandardWorkItem> {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERDetermineNCDEligibility_ACC)
  private var _erProcessUtils : ERProcessUtils_ACC
  construct () {
    super(BatchProcessType.TC_ERDETERMINENCDELIGIBILITY_ACC, StandardWorkItem, ERRunPolicyGroup_ACC)
    this._erProcessUtils = new ERProcessUtils_ACC()
  }

  override function findTargets(): Iterator<ERRunPolicyGroup_ACC> {
    var queryRunCalcAccID = Query.make(ERRunCalcResult_ACC)
        .compare(ERRunCalcResult_ACC#ACCPolicyID_ACC, Relop.NotEquals, null)
    queryRunCalcAccID.join(ERRunCalcResult_ACC#ERRun)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)

    var queryPolicyGroup = Query.make(ERRunPolicyGroup_ACC)
        .compare(ERRunPolicyGroup_ACC#ACCPolicyID_ACC, Relop.NotEquals, null)
    queryPolicyGroup.join(ERRunPolicyGroup_ACC#ERRun)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
    queryPolicyGroup.subselect("ERRun", InOperation.CompareNotIn, queryRunCalcAccID, "ERRun")
    queryPolicyGroup.subselect("ACCPolicyID_ACC", InOperation.CompareNotIn, queryRunCalcAccID, "ACCPolicyID_ACC")
    return queryPolicyGroup.select().iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    try {
      var policyGroup = extractTarget(item)
      _logger.info("  --> Group: ${policyGroup.ERBusinessGroup} |AccID: ${policyGroup.ACCPolicyID_ACC}")
      var erRunParam = new ERRunParameter(policyGroup.ERRun.ERRequest.LevyYear)
      if (policyGroup.Processed == Boolean.FALSE || policyGroup.Processed == null) {
        var expLEandLevy = new ERRunExperienceLEandLevy()
        var listExpYears = _erProcessUtils.getTargetYears(erRunParam, Boolean.FALSE)
        var aggregatedLEandLevy = _erProcessUtils.getAggregatedLEandLevy(policyGroup)
        for (row in aggregatedLEandLevy) {
          var sumLiableEarnings = new MonetaryAmount(row.getColumn("SumLiableEarnings") as BigDecimal, Currency.TC_NZD)
          var sumLevyDue = new MonetaryAmount(row.getColumn("SumLevyDue") as BigDecimal, Currency.TC_NZD)
          var levyYear = row.getColumn("LevyYear") as Integer
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
        }
        _erProcessUtils.updatePolicyGroupLEandLevy(policyGroup, expLEandLevy)
      }

      createRunResultForNCDEligible(erRunParam, policyGroup)
    } catch (e : Exception) {
      _logger.error_ACC(e.Message, e)
      throw e
    }
  }

  function createRunResultForNCDEligible(erRunParam : ERRunParameter, policyGroup : ERRunPolicyGroup_ACC) {
    var groupSuffix = _erProcessUtils.getGroupSuffix(policyGroup)
    var ncdCalcType = _erProcessUtils.getERCalculationTypeLevyYear(erRunParam.levyYear, ERProgramme_ACC.TC_NCD)
    var stdCalcType = _erProcessUtils.getERCalculationTypeLevyYear(erRunParam.levyYear, ERProgramme_ACC.TC_STD)
    var malt = new MonetaryAmount(erRunParam.minAnnualLevyThreshold, Currency.TC_NZD)
    var validationCounter = new ERRunValidationCounter()
    _erProcessUtils.validateExpYearLEandLevy(policyGroup.ExpLevyYear1, policyGroup.SumLiableEarningsYear1, policyGroup.SumLevyDueYear1,
        malt, validationCounter)
    _erProcessUtils.validateExpYearLEandLevy(policyGroup.ExpLevyYear2, policyGroup.SumLiableEarningsYear2, policyGroup.SumLevyDueYear2,
        malt, validationCounter)
    _erProcessUtils.validateExpYearLEandLevy(policyGroup.ExpLevyYear3, policyGroup.SumLiableEarningsYear3, policyGroup.SumLevyDueYear3,
        malt, validationCounter)
    if (validationCounter.yearMissingCPFullTimeMinEarn.size() == 0) {
      if (validationCounter.expWithLEorLevy == 3 && validationCounter.validLE == 3) {
        _erProcessUtils.createERRunCalcResult(policyGroup,
            ERProgramme_ACC.TC_NCD, null, null, null, null, null, ncdCalcType)
      } else {
        var ineligibleReason : String
        if (validationCounter.expWithLEorLevy < 3) {
          ineligibleReason = 'No liable earnings for one or more of the levy years in the experience period'
        } else if (validationCounter.validLE < 3) {
          ineligibleReason = 'Liable earnings below statutory minimum for one or more of the levy years in the experience period'
        }
        _erProcessUtils.createERRunCalcResult(policyGroup,
            ERProgramme_ACC.TC_STD, ineligibleReason, 0, null, null, null, stdCalcType)
      }
    } else {
      _erProcessUtils.createERRunCalcResult(policyGroup,
          ERProgramme_ACC.TC_STD, null, 0, Boolean.TRUE,
          "Cannot find CP FullTime Min Earnings for levy year ${validationCounter.yearMissingCPFullTimeMinEarn.get(0)}",
          ERManualCalcStatus_ACC.TC_PENDING, stdCalcType)
    }
    _erProcessUtils.updatePolicyGroupCounters(policyGroup, validationCounter)
  }
}