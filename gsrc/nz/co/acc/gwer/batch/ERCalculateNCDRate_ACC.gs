package nz.co.acc.gwer.batch

uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.api.database.Query
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses nz.co.acc.gwer.ERRunParameter
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses java.math.BigDecimal


class ERCalculateNCDRate_ACC extends WorkQueueBase<ERRunCalcResult_ACC, StandardWorkItem> {
  private var _erProcessUtils : ERProcessUtils_ACC
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERCalculateNCDRate_ACC)

  construct () {
    super(BatchProcessType.TC_ERCALCULATENCDRATE_ACC, StandardWorkItem, ERRunCalcResult_ACC)
    this._erProcessUtils = new ERProcessUtils_ACC()
  }

  override function findTargets(): Iterator<ERRunCalcResult_ACC> {
    var queryRunCalcResult = Query.make(ERRunCalcResult_ACC)
        .compare(ERRunCalcResult_ACC#ERProgramme, Relop.Equals, ERProgramme_ACC.TC_NCD)
    queryRunCalcResult.join(ERRunCalcResult_ACC#ERRun)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
    return queryRunCalcResult.select().iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    var runCalcResult = extractTarget(item)
    var levyYear = runCalcResult.ERRun.ERRequest.LevyYear
    var erRunParam = new ERRunParameter(runCalcResult.ERRun.ERRequest.LevyYear)

    var NCDD = erRunParam.noClaimsDiscountDiscount
    var NCDL = erRunParam.noClaimsDiscountLoading
    var NCTL = erRunParam.noClaimsThresholdLower
    var NCTU = erRunParam.noClaimsThresholdUpper

    if(NCDD == null or NCDL == null or NCTL == null or NCTU == null) {
      _logger.error_ACC("ER Parameters missing for levy year ${levyYear}")
    }
    var bundle = gw.transaction.Transaction.newBundle()

    var isFatalTotal = runCalcResult.IsFatalTotal != null ? runCalcResult.IsFatalTotal : 0
    var wcdTotal = runCalcResult.WCDTotal != null ? runCalcResult.WCDTotal : BigDecimal.ZERO
    var nRunCalcResult = bundle.add(runCalcResult)
    var source = nRunCalcResult.ERBusinessGroup != null ? nRunCalcResult.ERBusinessGroup.BusinessGroupID : nRunCalcResult.ACCPolicyID_ACC
    _logger.info("Source : ${source}, isFatalTotal ${isFatalTotal} wcdTotal ${wcdTotal}")
    if (isFatalTotal >= 1) {
      nRunCalcResult.ERMod = NCDL / 100
      _logger.info("Source : ${source}, setting to NCDL")
    } else if (isFatalTotal == 0 and wcdTotal < NCTL) {
      nRunCalcResult.ERMod = NCDD / 100
      _logger.info("Source : ${source}, setting to NCDD")
    } else if (isFatalTotal == 0 and wcdTotal > NCTU) {
      nRunCalcResult.ERMod = NCDL / 100
      _logger.info("Source : ${source}, setting to NCDL")
    } else if (isFatalTotal == 0 and (wcdTotal >= NCTL and wcdTotal <= NCTU)) {
      nRunCalcResult.ERMod = BigDecimal.ZERO
      _logger.info("Source : ${source}, setting to ZERO")
    } else {
      nRunCalcResult.ERMod = BigDecimal.ZERO
      _logger.info("Source : ${source}, default to zero")
    }

    _logger.info("Source : ${source}, ERMod value ${nRunCalcResult.ERMod}")
    bundle.commit()
  }
}