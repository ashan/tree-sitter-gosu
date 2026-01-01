package nz.co.acc.gwer.batch

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.processes.WorkQueueBase
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses nz.co.acc.gwer.ERRunParameter
uses nz.co.acc.lob.common.DateUtil_ACC
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC

uses java.math.MathContext
uses java.math.BigDecimal
uses java.math.RoundingMode


class ERCalculateERRate_ACC extends WorkQueueBase<ERRunCalcResult_ACC, StandardWorkItem> {
  private static var _medium = "Medium"
  private static var _large = "Large"
  private static var _Risk = "Risk"
  private static var _Rehab = "Rehab"
  private static var _scale8 = 8
  private static var _scale6 = 6
  private var _erProcessUtils : ERProcessUtils_ACC
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERCalculateERRate_ACC)

  construct () {
    super(BatchProcessType.TC_ERCALCULATEERRATE_ACC, StandardWorkItem, ERRunCalcResult_ACC)
    this._erProcessUtils = new ERProcessUtils_ACC()
  }

  override function findTargets(): Iterator<ERRunCalcResult_ACC> {
    var queryRunCalcResult = Query.make(ERRunCalcResult_ACC)
        .compare(ERRunCalcResult_ACC#ERProgramme, Relop.Equals, ERProgramme_ACC.TC_ER)
    queryRunCalcResult.join(ERRunCalcResult_ACC#ERRun)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
    return queryRunCalcResult.select().iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    try {
      var runCalcResult = extractTarget(item)
      var levyYear = runCalcResult.ERRun.ERRequest.LevyYear
      var erRunParam = new ERRunParameter(levyYear)
      var bundle = gw.transaction.Transaction.newBundle()
      runCalcResult = bundle.add(runCalcResult)

      if (runCalcResult.ERCalculationType == ERCalculationType_ACC.TC_ERLEGACY) {
        calculateLegacyER(runCalcResult, levyYear, erRunParam, bundle)
      } else {
        calculateSER(runCalcResult, levyYear, erRunParam, bundle)
      }
      bundle.commit()
    } catch(e: Exception) {
      _logger.error_ACC(e.getMessage(), e)
      e.printStackTrace()
      throw e
    }
  }

  function calculateLegacyER (runCalcResult : ERRunCalcResult_ACC, levyYear : Integer, erRunParam : ERRunParameter, bundle : Bundle) {
    determineERSizeBand(erRunParam, runCalcResult)
    var erRunCalcLRGComp = _erProcessUtils.getERRunCalcLRGComp(runCalcResult)
    var iMod = BigDecimal.ZERO
    var preOBAEMod = BigDecimal.ZERO

    for (lrgComp in erRunCalcLRGComp) {
      lrgComp = bundle.add(lrgComp)

      var lrgLevyRatio = lrgComp.getLRGLevyDueTotal_amt() / runCalcResult.getLevyDueTotal_amt()
      var lrgParamValue = _erProcessUtils.getERLRGParametersValue_ACC(lrgComp.getERParamLRG(), 0)
      identifyModForLRG(runCalcResult.getERSizeBand(), lrgParamValue, lrgComp)
      determineERCredibilityWeighting(levyYear, lrgComp)
      iMod = _erProcessUtils.sumDecimalArray({iMod, lrgComp.getLRGIMod() * lrgLevyRatio})

      calculateLRGActualRiskMgmtRate(lrgComp)
      identifyExpectedRiskMgmtRate(runCalcResult.getERSizeBand(), lrgParamValue, lrgComp)
      calculateERRiskMgmtComponent(erRunParam, lrgComp)

      calculateLRGActualRehabMgmtRate(lrgComp)
      identifyExpectedRehabMgmtRate(runCalcResult.getERSizeBand(), lrgParamValue, lrgComp)
      calculateERRehabMgmtComponent(erRunParam, lrgComp)

      calculateLRGERModifer(erRunParam, lrgComp)
      preOBAEMod = _erProcessUtils.sumDecimalArray({preOBAEMod, lrgComp.getLRGEMod() * lrgLevyRatio})
    }
    calculateTotalERIndustrySizeModifier(iMod, runCalcResult)
    calculatePreOffBalanceERModifier(preOBAEMod, runCalcResult)
    applyOffBalanceAdjustment(runCalcResult.getERSizeBand(), erRunParam, runCalcResult)
    calculateTotalERModifier(runCalcResult)
  }

  function calculateSER(runCalcResult : ERRunCalcResult_ACC, levyYear : Integer, erRunParam : ERRunParameter, bundle : Bundle) {
    determineERSizeBand(erRunParam, runCalcResult)
    var erRunCalcLRGComp = _erProcessUtils.getERRunCalcLRGComp(runCalcResult)
    var uncappedEmodYr1 = BigDecimal.ZERO
    var uncappedEmodYr2 = BigDecimal.ZERO
    var uncappedEmodYr3 = BigDecimal.ZERO

    for (lrgComp in erRunCalcLRGComp) {
      lrgComp = bundle.add(lrgComp)
      var lrgLevyRatioYr1 = lrgComp.getLRGLevyDueTotalYear1_amt() / runCalcResult.getLevyDueTotalYear1_amt()
      var lrgLevyRatioYr2 = lrgComp.getLRGLevyDueTotalYear2_amt() / runCalcResult.getLevyDueTotalYear2_amt()
      var lrgLevyRatioYr3 = lrgComp.getLRGLevyDueTotalYear3_amt() / runCalcResult.getLevyDueTotalYear3_amt()

      var lrgParamValueYr1 = _erProcessUtils.getERLRGParametersValue_ACC(lrgComp.getERParamLRG(), DateUtil_ACC.getLevyYear(erRunParam.experiencePeriodStartDate))
      var lrgParamValueYr2 = _erProcessUtils.getERLRGParametersValue_ACC(lrgComp.getERParamLRG(), DateUtil_ACC.getLevyYear(erRunParam.experiencePeriodStartDate)+1)
      var lrgParamValueYr3 = _erProcessUtils.getERLRGParametersValue_ACC(lrgComp.getERParamLRG(), DateUtil_ACC.getLevyYear(erRunParam.experiencePeriodEndDate))
      determineERCredibilityWeightingPerYear(levyYear, lrgComp)
      calculateLRGActualRiskMgmtRatePerYear(lrgComp)
      identifyExpectedRiskMgmtRatePerYear(runCalcResult.getERSizeBand(), lrgParamValueYr1, lrgParamValueYr2, lrgParamValueYr3, lrgComp)
      calculateERRiskMgmtComponentPerYear(erRunParam, lrgComp)

      calculateLRGActualRehabMgmtRatePerYear(lrgComp)
      identifyExpectedRehabMgmtRatePerYear(runCalcResult.getERSizeBand(), lrgParamValueYr1, lrgParamValueYr2, lrgParamValueYr3, lrgComp)
      calculateERRehabMgmtComponentPerYear(erRunParam, lrgComp)
      calculateLRGERModiferPerYear(erRunParam, lrgComp)

      uncappedEmodYr1 = _erProcessUtils.sumDecimalArray({uncappedEmodYr1, lrgComp.getLRGEModYear1() * lrgLevyRatioYr1}).setScale(_scale8, RoundingMode.HALF_UP)
      uncappedEmodYr2 = _erProcessUtils.sumDecimalArray({uncappedEmodYr2, lrgComp.getLRGEModYear2() * lrgLevyRatioYr2}).setScale(_scale8, RoundingMode.HALF_UP)
      uncappedEmodYr3 = _erProcessUtils.sumDecimalArray({uncappedEmodYr3, lrgComp.getLRGEModYear3() * lrgLevyRatioYr3}).setScale(_scale8, RoundingMode.HALF_UP)
    }
    calculateEModPerYear(uncappedEmodYr1, uncappedEmodYr2, uncappedEmodYr3, runCalcResult)
    calculateEModSER(erRunParam, runCalcResult)
    calculateERModifierWithSteps(levyYear, runCalcResult)
  }

  function determineERSizeBand(erRunParam : ERRunParameter, runCalcResult : ERRunCalcResult_ACC) {
    var expPeriodYears = erRunParam.experiencePeriodEndDate.YearOfDate
        - erRunParam.experiencePeriodStartDate.YearOfDate
    var earningsAverage = runCalcResult.LiableEarningsTotal.Amount / expPeriodYears
    if(earningsAverage <= erRunParam.largeEmpEarningsThreshold) {
      runCalcResult.ERSizeBand = _medium
    } else {
      runCalcResult.ERSizeBand = _large
    }
  }

  function identifyModForLRG(erSizeBand : String, lrgParamValue : ERLRGParametersValue_ACC, lrgComp : ERRunCalcLRGComp_ACC) {
    if(erSizeBand.equalsIgnoreCase(_medium)) {
      lrgComp.LRGIMod = lrgParamValue.IndustrySizeModifier_MedEmp / 100
    } else {
      lrgComp.LRGIMod = lrgParamValue.IndustrySizeModifier_LgeEmp / 100
    }
  }

  function determineERCredibilityWeighting(levyYear : Integer, lrgComp : ERRunCalcLRGComp_ACC) {
    var maxWeightingBand = _erProcessUtils.getMaxERCredibilityWeightingBand(levyYear)

    lrgComp.LRGCredibilityWeighting = getERCredibilityWeightingValue(
        0, levyYear, lrgComp.LRGLiableEarningTotal_amt, maxWeightingBand
    )
  }

  function determineERCredibilityWeightingPerYear(levyYear : Integer, lrgComp : ERRunCalcLRGComp_ACC) {
    var maxWeightingBand = _erProcessUtils.getMaxERCredibilityWeightingBand(levyYear)

    lrgComp.LRGCredibilityWeightingYear1 = getERCredibilityWeightingValue(
        1, levyYear, lrgComp.LRGLiableEarningTotalYear1_amt, maxWeightingBand
    )
    lrgComp.LRGCredibilityWeightingYear2 = getERCredibilityWeightingValue(
        2, levyYear, lrgComp.LRGLiableEarningTotalYear2_amt, maxWeightingBand
    )
    lrgComp.LRGCredibilityWeightingYear3 = getERCredibilityWeightingValue(
        3, levyYear, lrgComp.LRGLiableEarningTotalYear3_amt, maxWeightingBand
    )
  }

  function getERCredibilityWeightingValue(expYear : Integer, levyYear : Integer, LRGLiableEarningTotal : BigDecimal, maxWeightingBand : ERParamCredibleWeight_ACC) : BigDecimal {
    var mc = new MathContext(_scale8)
    if (LRGLiableEarningTotal == null or LRGLiableEarningTotal.IsZero) {
      return BigDecimal.ZERO
    } else {
      var weightingBand = _erProcessUtils.getERCredibilityWeightingBand(levyYear, LRGLiableEarningTotal)
      if (weightingBand.CredibilityWeightingBand != null) {
        var minLE = (LRGLiableEarningTotal - weightingBand.MinLiableEarnings_amt)
        var bandLE = minLE.divide(weightingBand.BandLiableEarnings_amt, new MathContext(20))
        var sqrtLE = bandLE.sqrt(new MathContext(15))
        _logger.info("calculateERCredibilityWeighting Year${expYear} ${minLE} | ${bandLE} | ${sqrtLE}")
        return ((new BigDecimal(weightingBand.CredibilityWtLowerLimit).divide(100, mc))
            + (weightingBand.BandCredibilityWt * sqrtLE)).setScale(_scale8, RoundingMode.HALF_UP)
      } else if (LRGLiableEarningTotal > maxWeightingBand.MaxLiableEarnings_amt) {
        return new BigDecimal(maxWeightingBand.CredibilityWtUpperLimit).divide(100, mc)
      }
      return BigDecimal.ZERO
    }
  }

  function calculateLRGActualRiskMgmtRate(lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGActualRiskMgmtRate = getLRGActualMgmtRateValue(
        0, lrgComp.LRGRiskMgmtClaimsTotal, lrgComp.LRGLiableEarningTotal_amt
    )
  }

  function calculateLRGActualRiskMgmtRatePerYear(lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGActualRiskMgmtRateYear1 = getLRGActualMgmtRateValue(
        1, lrgComp.LRGRiskMgmtClaimsTotalYear1, lrgComp.LRGLiableEarningTotalYear1_amt
    )
    lrgComp.LRGActualRiskMgmtRateYear2 = getLRGActualMgmtRateValue(
        2, lrgComp.LRGRiskMgmtClaimsTotalYear2, lrgComp.LRGLiableEarningTotalYear2_amt
    )
    lrgComp.LRGActualRiskMgmtRateYear3 = getLRGActualMgmtRateValue(
        3, lrgComp.LRGRiskMgmtClaimsTotalYear3, lrgComp.LRGLiableEarningTotalYear3_amt
    )
  }

  function identifyExpectedRiskMgmtRate(erSizeBand: String, lrgParamValue : ERLRGParametersValue_ACC, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGExpectedRiskMgmtRate = getExpectedMgmtRateValue(
        _Risk, erSizeBand, lrgParamValue
    )
  }

  function identifyExpectedRiskMgmtRatePerYear(erSizeBand: String, lrgParamValueYr1 : ERLRGParametersValue_ACC, lrgParamValueYr2 : ERLRGParametersValue_ACC, lrgParamValueYr3 : ERLRGParametersValue_ACC, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGExpectedRiskMgmtRateYear1 = getExpectedMgmtRateValue(
        _Risk, erSizeBand, lrgParamValueYr1
    )
    lrgComp.LRGExpectedRiskMgmtRateYear2 = getExpectedMgmtRateValue(
        _Risk, erSizeBand, lrgParamValueYr2
    )
    lrgComp.LRGExpectedRiskMgmtRateYear3 = getExpectedMgmtRateValue(
        _Risk, erSizeBand, lrgParamValueYr3
    )
  }

  function calculateERRiskMgmtComponent(erRunParam : ERRunParameter, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.UncappedLRGRiskMgmtComp = getMgmtComponentValue(
        lrgComp.LRGActualRiskMgmtRate, lrgComp.LRGExpectedRiskMgmtRate, lrgComp.LRGCredibilityWeighting
    )
    lrgComp.CappedLRGRiskMgmtComp = _erProcessUtils.applyCeilingAndFlooring(
        lrgComp.UncappedLRGRiskMgmtComp, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    ).setScale(_scale6, RoundingMode.HALF_UP)
  }

  function calculateERRiskMgmtComponentPerYear(erRunParam : ERRunParameter, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.UncappedLRGRiskMgmtCompYear1 = getMgmtComponentValue(
        lrgComp.LRGActualRiskMgmtRateYear1, lrgComp.LRGExpectedRiskMgmtRateYear1, lrgComp.LRGCredibilityWeightingYear1
    )
    lrgComp.CappedLRGRiskMgmtCompYear1 = _erProcessUtils.applyCeilingAndFlooring(
        lrgComp.UncappedLRGRiskMgmtCompYear1, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    ).setScale(_scale6, RoundingMode.HALF_UP)

    lrgComp.UncappedLRGRiskMgmtCompYear2 = getMgmtComponentValue(
        lrgComp.LRGActualRiskMgmtRateYear2, lrgComp.LRGExpectedRiskMgmtRateYear2, lrgComp.LRGCredibilityWeightingYear2
    )
    lrgComp.CappedLRGRiskMgmtCompYear2 = _erProcessUtils.applyCeilingAndFlooring(
        lrgComp.UncappedLRGRiskMgmtCompYear2, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    ).setScale(_scale6, RoundingMode.HALF_UP)

    lrgComp.UncappedLRGRiskMgmtCompYear3 = getMgmtComponentValue(
        lrgComp.LRGActualRiskMgmtRateYear3, lrgComp.LRGExpectedRiskMgmtRateYear3, lrgComp.LRGCredibilityWeightingYear3
    )
    lrgComp.CappedLRGRiskMgmtCompYear3 = _erProcessUtils.applyCeilingAndFlooring(
        lrgComp.UncappedLRGRiskMgmtCompYear3, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    ).setScale(_scale6, RoundingMode.HALF_UP)
  }

  function calculateLRGActualRehabMgmtRate(lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGActualRehabMgmtRate = getLRGActualMgmtRateValue(
        0, lrgComp.LRGWCDTotal, lrgComp.LRGLiableEarningTotal_amt
    )
  }

  function calculateLRGActualRehabMgmtRatePerYear(lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGActualRehabMgmtRateYear1 = getLRGActualMgmtRateValue(
        1, lrgComp.LRGWCDTotalYear1, lrgComp.LRGLiableEarningTotalYear1_amt
    )
    lrgComp.LRGActualRehabMgmtRateYear2 = getLRGActualMgmtRateValue(
        2, lrgComp.LRGWCDTotalYear2, lrgComp.LRGLiableEarningTotalYear2_amt
    )
    lrgComp.LRGActualRehabMgmtRateYear3 = getLRGActualMgmtRateValue(
        3, lrgComp.LRGWCDTotalYear3, lrgComp.LRGLiableEarningTotalYear3_amt
    )
  }

  function identifyExpectedRehabMgmtRate(erSizeBand: String, lrgParamValue : ERLRGParametersValue_ACC, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGExpectedRehabMgmtRate = getExpectedMgmtRateValue(
        _Rehab, erSizeBand, lrgParamValue
    )
  }

  function identifyExpectedRehabMgmtRatePerYear(erSizeBand: String, lrgParamValueYr1 : ERLRGParametersValue_ACC, lrgParamValueYr2 : ERLRGParametersValue_ACC, lrgParamValueYr3 : ERLRGParametersValue_ACC, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGExpectedRehabMgmtRateYear1 = getExpectedMgmtRateValue(
        _Rehab, erSizeBand, lrgParamValueYr1
    )
    lrgComp.LRGExpectedRehabMgmtRateYear2 = getExpectedMgmtRateValue(
        _Rehab, erSizeBand, lrgParamValueYr2
    )
    lrgComp.LRGExpectedRehabMgmtRateYear3 = getExpectedMgmtRateValue(
        _Rehab, erSizeBand, lrgParamValueYr3
    )
  }

  function calculateERRehabMgmtComponent(erRunParam : ERRunParameter, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.UncappedLRGRehabMgmtComp = getMgmtComponentValue(
        lrgComp.LRGActualRehabMgmtRate, lrgComp.LRGExpectedRehabMgmtRate, lrgComp.LRGCredibilityWeighting
    )
    lrgComp.CappedLRGRehabMgmtComp = _erProcessUtils.applyCeilingAndFlooring(
        lrgComp.UncappedLRGRehabMgmtComp, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    ).setScale(_scale6, RoundingMode.HALF_UP)
  }

  function calculateERRehabMgmtComponentPerYear(erRunParam : ERRunParameter, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.UncappedLRGRehabMgmtCompYear1 = getMgmtComponentValue(
        lrgComp.LRGActualRehabMgmtRateYear1, lrgComp.LRGExpectedRehabMgmtRateYear1, lrgComp.LRGCredibilityWeightingYear1
    )
    lrgComp.CappedLRGRehabMgmtCompYear1 = _erProcessUtils.applyCeilingAndFlooring(
        lrgComp.UncappedLRGRehabMgmtCompYear1, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    ).setScale(_scale6, RoundingMode.HALF_UP)

    lrgComp.UncappedLRGRehabMgmtCompYear2 = getMgmtComponentValue(
        lrgComp.LRGActualRehabMgmtRateYear2, lrgComp.LRGExpectedRehabMgmtRateYear2, lrgComp.LRGCredibilityWeightingYear2
    )
    lrgComp.CappedLRGRehabMgmtCompYear2 = _erProcessUtils.applyCeilingAndFlooring(
        lrgComp.UncappedLRGRehabMgmtCompYear2, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    ).setScale(_scale6, RoundingMode.HALF_UP)

    lrgComp.UncappedLRGRehabMgmtCompYear3 = getMgmtComponentValue(
        lrgComp.LRGActualRehabMgmtRateYear3, lrgComp.LRGExpectedRehabMgmtRateYear3, lrgComp.LRGCredibilityWeightingYear3
    )
    lrgComp.CappedLRGRehabMgmtCompYear3 = _erProcessUtils.applyCeilingAndFlooring(
        lrgComp.UncappedLRGRehabMgmtCompYear3, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    ).setScale(_scale6, RoundingMode.HALF_UP)
  }

  function getLRGActualMgmtRateValue(expYear: Integer, dividendAmount : BigDecimal, LRGLiableEarningTotal : BigDecimal) : BigDecimal {
    if(LRGLiableEarningTotal == null or LRGLiableEarningTotal.IsZero or dividendAmount == null) {
      return BigDecimal.ZERO
    } else {
      _logger.info("getLRGActualMgmtRateValue Year${expYear} ${dividendAmount} / ${LRGLiableEarningTotal}")
      return ((dividendAmount / LRGLiableEarningTotal) * 1000000).setScale(_scale8, RoundingMode.HALF_UP)
    }
  }

  function getExpectedMgmtRateValue(dataType : String, erSizeBand: String, lrgParamValue : ERLRGParametersValue_ACC) : BigDecimal {
    if (dataType.equalsIgnoreCase(_Risk)) {
      if(erSizeBand.equalsIgnoreCase(_medium)) {
        return lrgParamValue.ExpectedRiskMgmtRate_MedEmp.setScale(_scale8, RoundingMode.HALF_UP)
      } else {
        return lrgParamValue.ExpectedRiskMgmtRate_LgeEmp.setScale(_scale8, RoundingMode.HALF_UP)
      }
    } else if (dataType.equalsIgnoreCase(_Rehab)) {
      if(erSizeBand.equalsIgnoreCase(_medium)) {
        return lrgParamValue.ExpectedRehabMgmtRate_MedEmp.setScale(_scale8, RoundingMode.HALF_UP)
      } else {
        return lrgParamValue.ExpectedRehabMgmtRate_LgeEmp.setScale(_scale8, RoundingMode.HALF_UP)
      }
    }
    return BigDecimal.ZERO
  }

  function getMgmtComponentValue(LRGActualMgmtRate : BigDecimal, LRGExpectedMgmtRate : BigDecimal, LRGCredibilityWeighting : BigDecimal) : BigDecimal {
    if(LRGExpectedMgmtRate.IsZero) {
      return BigDecimal.ZERO
    } else {
      return (((LRGActualMgmtRate - LRGExpectedMgmtRate) / LRGExpectedMgmtRate)
              * LRGCredibilityWeighting
      ).setScale(_scale6, RoundingMode.HALF_UP)
    }
  }

  function calculateLRGERModifer(erRunParam : ERRunParameter, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGEMod = ((erRunParam.weightToRiskComponent * lrgComp.CappedLRGRiskMgmtComp)
        + (erRunParam.weightToRehabComponent * lrgComp.CappedLRGRehabMgmtComp)).setScale(_scale8, RoundingMode.HALF_UP)
  }

  function calculateLRGERModiferPerYear(erRunParam : ERRunParameter, lrgComp : ERRunCalcLRGComp_ACC) {
    lrgComp.LRGEModYear1 = ((erRunParam.weightToRiskComponent * lrgComp.CappedLRGRiskMgmtCompYear1)
        + (erRunParam.weightToRehabComponent * lrgComp.CappedLRGRehabMgmtCompYear1)).setScale(_scale8, RoundingMode.HALF_UP)

    lrgComp.LRGEModYear2 = ((erRunParam.weightToRiskComponent * lrgComp.CappedLRGRiskMgmtCompYear2)
        + (erRunParam.weightToRehabComponent * lrgComp.CappedLRGRehabMgmtCompYear2)).setScale(_scale8, RoundingMode.HALF_UP)

    lrgComp.LRGEModYear3 = ((erRunParam.weightToRiskComponent * lrgComp.CappedLRGRiskMgmtCompYear3)
        + (erRunParam.weightToRehabComponent * lrgComp.CappedLRGRehabMgmtCompYear3)).setScale(_scale8, RoundingMode.HALF_UP)
  }

  function calculateTotalERIndustrySizeModifier(iMod : BigDecimal, runCalcResult : ERRunCalcResult_ACC) {
    runCalcResult.IMod = iMod
  }

  function calculatePreOffBalanceERModifier(preOBAEMod : BigDecimal, runCalcResult : ERRunCalcResult_ACC) {
    runCalcResult.PreOBAEMod = preOBAEMod
  }

  function applyOffBalanceAdjustment(erSizeBand : String, erRunParam : ERRunParameter, runCalcResult : ERRunCalcResult_ACC) {
    if (erSizeBand.equalsIgnoreCase(_medium)) {
      runCalcResult.OBA = erRunParam.offBalAdjMediumEmp
    } else {
      runCalcResult.OBA = erRunParam.offBalAdjLargeEmp
    }

    runCalcResult.UncappedEMod = runCalcResult.PreOBAEMod
        * (1 - runCalcResult.PreOBAEMod * runCalcResult.OBA)
    runCalcResult.EMod = _erProcessUtils.applyCeilingAndFlooring(
        runCalcResult.UncappedEMod, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    )
  }

  function calculateTotalERModifier(runCalcResult : ERRunCalcResult_ACC) {
    runCalcResult.ERMod = runCalcResult.getEMod() + runCalcResult.getIMod()
  }

  function calculateEModPerYear(uncappedEmodYr1 : BigDecimal, uncappedEmodYr2 : BigDecimal, uncappedEmodYr3 : BigDecimal, runCalcResult : ERRunCalcResult_ACC) {
    runCalcResult.UncappedEModYear1 = uncappedEmodYr1
    runCalcResult.UncappedEModYear2 = uncappedEmodYr2
    runCalcResult.UncappedEModYear3 = uncappedEmodYr3

    var runLevyYear = runCalcResult.ERRun.ERRequest.LevyYear
    var claimsWeightYr1 = _erProcessUtils.getERParamClaimsWeight(runLevyYear, 1).getWeighting()
    var claimsWeightYr2 = _erProcessUtils.getERParamClaimsWeight(runLevyYear, 2).getWeighting()
    var claimsWeightYr3 = _erProcessUtils.getERParamClaimsWeight(runLevyYear, 3).getWeighting()
    var claimsWeightTotal = _erProcessUtils.sumDecimalArray({claimsWeightYr1, claimsWeightYr2, claimsWeightYr3})

    runCalcResult.UncappedEModWeightedYear1 = (runCalcResult.UncappedEModYear1 * (claimsWeightYr1 / claimsWeightTotal)).setScale(_scale8, RoundingMode.HALF_UP)
    runCalcResult.UncappedEModWeightedYear2 = (runCalcResult.UncappedEModYear2 * (claimsWeightYr2 / claimsWeightTotal)).setScale(_scale8, RoundingMode.HALF_UP)
    runCalcResult.UncappedEModWeightedYear3 = (runCalcResult.UncappedEModYear3 * (claimsWeightYr3 / claimsWeightTotal)).setScale(_scale8, RoundingMode.HALF_UP)
  }

  function calculateEModSER(erRunParam : ERRunParameter, runCalcResult : ERRunCalcResult_ACC) {
    var uncappedEModWeightTotal = _erProcessUtils.sumDecimalArray({
        runCalcResult.UncappedEModWeightedYear1, runCalcResult.UncappedEModWeightedYear2, runCalcResult.UncappedEModWeightedYear3
    })

    runCalcResult.UncappedEMod = uncappedEModWeightTotal
    runCalcResult.EMod = _erProcessUtils.applyCeilingAndFlooring(
        runCalcResult.UncappedEMod, erRunParam.upperExpModCap, erRunParam.lowerExpModCap
    )
  }

  function calculateERModifierWithSteps(runLevyYear : Integer, runCalcResult : ERRunCalcResult_ACC) {
    var minDiscLoadStep = _erProcessUtils.getMinERParamDiscLoadSteps(runLevyYear)
    if (runCalcResult.EMod.IsZero) {
      runCalcResult.ERMod = BigDecimal.ZERO
    } else if (runCalcResult.EMod == new BigDecimal(minDiscLoadStep.BandMin).multiply(0.01)) {
      runCalcResult.ERParamDiscLoadSteps = minDiscLoadStep
      runCalcResult.ERMod = new BigDecimal(minDiscLoadStep.Step).multiply(0.01).setScale(_scale8, RoundingMode.HALF_UP)
    } else {
      var discLoadStep = _erProcessUtils.getERParamDiscLoadSteps(runLevyYear, runCalcResult.getEMod())
      runCalcResult.ERParamDiscLoadSteps = discLoadStep
      runCalcResult.ERMod = new BigDecimal(discLoadStep.Step).multiply(0.01).setScale(_scale8, RoundingMode.HALF_UP)
    }
    runCalcResult.BeforeAdj_ERParamDiscLoadSteps = runCalcResult.ERParamDiscLoadSteps
    runCalcResult.BeforeAdj_ERMod = runCalcResult.ERMod

    var inclInFactorYr1 = runCalcResult.IncludeInFactorYear1 ? 1 : 0
    var inclInFactorYr2 = runCalcResult.IncludeInFactorYear2 ? 1 : 0
    var inclInFactorYr3 = runCalcResult.IncludeInFactorYear3 ? 1 : 0
    if ((inclInFactorYr1 + inclInFactorYr2 + inclInFactorYr3) > 0) {
      var maxInclAdj = Math.max(Math.max(inclInFactorYr1, inclInFactorYr2), inclInFactorYr3)

      var paramStepAdj = _erProcessUtils.getERParamStepAdj(runLevyYear)
      var maxAdj = Math.max(Math.max(paramStepAdj.Year1Adjustment, paramStepAdj.Year2Adjustment), paramStepAdj.Year3Adjustment)

      runCalcResult.StepAdjustment = maxInclAdj > maxAdj ? maxAdj : maxInclAdj
    } else {
      //default to 0
      runCalcResult.StepAdjustment = 0
    }

    if (runCalcResult.StepAdjustment > 0) {
      var cappedAdj : Boolean
      var adjustedDiscLoadStep = _erProcessUtils.getAdjustedERParamDiscLoadStep(
          runLevyYear, runCalcResult.ERMod, runCalcResult.StepAdjustment, cappedAdj
      )
      if (adjustedDiscLoadStep != null) {
        runCalcResult.ERParamDiscLoadSteps = adjustedDiscLoadStep
        runCalcResult.ERMod = adjustedDiscLoadStep.Step
        runCalcResult.IsERModAdjCapped = cappedAdj
      }
    }
  }
}