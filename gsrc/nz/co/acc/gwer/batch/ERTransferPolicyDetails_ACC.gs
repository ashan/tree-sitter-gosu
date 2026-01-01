package nz.co.acc.gwer.batch

uses gw.api.database.DBFunction
uses gw.api.database.IQueryResult
uses gw.api.database.QueryRow
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.ERRunParameter
uses nz.co.acc.gwer.ERRunPolicyValues
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses gw.api.database.Relop
uses gw.api.database.Query

uses java.math.RoundingMode
uses gw.pl.persistence.core.Key
uses java.math.BigDecimal

class ERTransferPolicyDetails_ACC extends WorkQueueBase<ERRunLevyPayer_ACC, StandardWorkItem> {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERTransferPolicyDetails_ACC)
  private var _erProcessUtils : ERProcessUtils_ACC
  construct () {
    super(BatchProcessType.TC_ERTRANSFERPOLICYDETAILS_ACC, StandardWorkItem, ERRunLevyPayer_ACC)
    this._erProcessUtils = new ERProcessUtils_ACC()
  }

  override function findTargets(): Iterator<ERRunLevyPayer_ACC> {
    var listTransferCounterparty = _erProcessUtils.TransferCounterpartyList
    var queryLevyPayer = Query.make(ERRunLevyPayer_ACC)
        .compareIn(ERRunLevyPayer_ACC#ACCPolicyID_ACC, listTransferCounterparty)
    queryLevyPayer.join(ERRunLevyPayer_ACC#ERRun)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)

    return queryLevyPayer.select().iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    var levyPayer = extractTarget(item)
    _logger.info("ERTransferPolicyDetails_ACC started ACCPolicyID: " + levyPayer.ACCPolicyID_ACC)

    try {
      var erRun = levyPayer.ERRun
      var erRunParam = new ERRunParameter(erRun.ERRequest.LevyYear)
      var listExpYears = _erProcessUtils.getTargetYears(erRunParam, Boolean.FALSE)
      var queryTransfer = _erProcessUtils.getERTransferBaseQuery(erRun.ERRequest.LevyYear)
      queryTransfer.compare(ERTransfer_ACC#SellerACCPolicyID, Relop.Equals, levyPayer.ACCPolicyID_ACC)
      var transferItems = queryTransfer.select().iterator()
      //Iterate through all transfer records where Seller is the target Levy Payer
      for (transfer in transferItems) {
        var transferBuyer = _erProcessUtils.getTransferBuyer(transfer)
        if (transfer.ERTransferType == ERTransferType_ACC.TC_FUL) {
          applyFullTransfer(transfer, levyPayer, transferBuyer)
        } else if (transfer.ERTransferType == ERTransferType_ACC.TC_SPL) {
          applySplitTransfer(transfer, levyPayer, transferBuyer, listExpYears)
        }
      }
    } catch(e: Exception) {
      _logger.error_ACC(e.Message, e)
    }

    _logger.info("ERTransferPolicyDetails_ACC ended ACCPolicyID: " + levyPayer.ACCPolicyID_ACC)
  }

  function applyFullTransfer(transfer : ERTransfer_ACC, sellerLevyPayer : ERRunLevyPayer_ACC, transferBuyer : ERTransferBuyer_ACC) {
    var erRun = sellerLevyPayer.ERRun
    var buyerLevyPayer = _erProcessUtils.getRunLevyPayer(erRun, transferBuyer.ACCPolicyID_ACC)
    _logger.info("Full Policy ER Transfer apply to Buyer: ${buyerLevyPayer.ACCPolicyID_ACC} |StartDate: ${transfer.TransferStartDate.toString()} |TransferDate: ${transfer.TransferDate.toString()}")
    // get all Policy details that belongs to the Seller
    var queryPolicy = Query.make(ERRunPolicyDetail_ACC)
    queryPolicy.compare(ERRunPolicyDetail_ACC#ERRun, Relop.Equals, erRun)
    queryPolicy.compare(ERRunPolicyDetail_ACC#ERRunLevyPayer, Relop.Equals, sellerLevyPayer)
    queryPolicy.or(\orQryYr -> {
      orQryYr.and(\orStart -> {
        orStart.compare(ERRunPolicyDetail_ACC#PeriodStart, Relop.GreaterThanOrEquals, transfer.TransferStartDate)
        orStart.compare(ERRunPolicyDetail_ACC#PeriodStart, Relop.LessThanOrEquals, transfer.TransferDate)
      })
      orQryYr.and(\orEnd -> {
        orEnd.compare(ERRunPolicyDetail_ACC#PeriodEnd, Relop.GreaterThanOrEquals, transfer.TransferStartDate)
        orEnd.compare(ERRunPolicyDetail_ACC#PeriodEnd, Relop.LessThanOrEquals, transfer.TransferDate)
      })
      orQryYr.and(\orOver -> {
        orOver.compare(ERRunPolicyDetail_ACC#PeriodStart, Relop.LessThan, transfer.TransferStartDate)
        orOver.compare(ERRunPolicyDetail_ACC#PeriodEnd, Relop.GreaterThan, transfer.TransferDate)
      })
    })
    var policyItems = queryPolicy.select()
    for (policyDetail in policyItems) {
//      _logger.info("[RunPolicy] ${policyDetail.ERRunLevyPayer.ACCPolicyID_ACC} |Buyer: ${buyerLevyPayer.ACCPolicyID_ACC} |LevyYear: ${policyDetail.LevyYear} |CUCode: ${policyDetail.ERParamCU.CUCode}")
      // replace the seller LevyPayer of the Run PolicyDetail with the buyer LevyPayer
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var oRunPolicyDetail = bundle.add(policyDetail)
        oRunPolicyDetail.ERTransfer = transfer
        oRunPolicyDetail.ERRunLevyPayer = buyerLevyPayer
      }, "sys")
      policyDetail.refresh()
    }
  }

  function applySplitTransfer(transfer : ERTransfer_ACC, sellerLevyPayer : ERRunLevyPayer_ACC, transferBuyer : ERTransferBuyer_ACC, listExpYears : Integer[]) {
    var erRun = sellerLevyPayer.ERRun
    var queryTransferDetail = Query.make(ERTransferPolicy_ACC)
        .compare(ERTransferPolicy_ACC#ERTransferBuyer, Relop.Equals, transferBuyer)
        .compareIn(ERTransferPolicy_ACC#LevyYear, listExpYears)
        .select()
    //Iterate through transfer policy (holds the target LevyYear and CUCode)
    for (transferPolicy in queryTransferDetail) {
      _logger.info("Split Policy ER Transfer sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} apply to Buyer: ${transferBuyer.ACCPolicyID_ACC} |CUCode: ${transferPolicy.CUCode} |LevyYear: ${transferPolicy.LevyYear} |LE: ${transferPolicy.LiableEarningsAmount}")
      var levyYear = transferPolicy.LevyYear
      var oCUCode = _erProcessUtils.getERParamCU(transferPolicy.CUCode, erRun.ERRequest.LevyYear, levyYear)

      // create dummy policy if exact match does not exists
      createDummyPolicy(transfer, erRun, sellerLevyPayer, oCUCode, levyYear)

      //Split: 3.) Get the oldest ID and Aggregate the LE and Levy of all Seller Policy with exact match
      var aggregatedPolicyResult = getAggregatedPolicyBySeller(erRun, sellerLevyPayer, oCUCode, levyYear)
      if (aggregatedPolicyResult.HasElements) {
        var aggregatedPolicy = aggregatedPolicyResult.FirstResult
        var minERRunPolicyID = aggregatedPolicy.getColumn("minERRunPolicyID")
        var sumLiableEarnings = aggregatedPolicy.getColumn("SumLiableEarnings") as BigDecimal
        var sumLevyDue = aggregatedPolicy.getColumn("SumLevyDue") as BigDecimal

        var policyExactMatch = getExactMatch(erRun, sellerLevyPayer, oCUCode, levyYear)
        if (policyExactMatch.hasNext()) {

          //Split: 4.) Update Seller Policy with oldest ID by setting LE and Levy to Aggregate/Total values
          var minPolicyDetail = policyExactMatch.toList().firstWhere(\elt -> elt.ID == minERRunPolicyID)
          if (minPolicyDetail != null) {
            _logger.info("aggregatedPolicyResult [split 4] - sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} current minPolicyDetail with Total LE: ${minPolicyDetail.ERRunLevyPayer.ACCPolicyID_ACC} |CUCode: ${minPolicyDetail.ERParamCU.CUCode} |LevyYear: ${minPolicyDetail.LevyYear} |LE: ${minPolicyDetail.LiableEarnings} |Levy: ${minPolicyDetail.LevyDue}")
            gw.transaction.Transaction.runWithNewBundle(\bundle -> {
              var oRunPolicyDetail = bundle.add(minPolicyDetail)
              oRunPolicyDetail.LiableEarnings = sumLiableEarnings
              oRunPolicyDetail.LevyDue = sumLevyDue
            }, "sys")
            minPolicyDetail.refresh()
            _logger.info("aggregatedPolicyResult [split 4] - sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} update minPolicyDetail with Total LE: ${minPolicyDetail.ERRunLevyPayer.ACCPolicyID_ACC} |CUCode: ${minPolicyDetail.ERParamCU.CUCode} |LevyYear: ${minPolicyDetail.LevyYear} |LE: ${sumLiableEarnings} |Levy: ${sumLevyDue}")
          }

          //Split: 5.) Update Seller Policy that is NOT the oldest ID by setting LE and Levy to ZERO
          var otherPolicyDetails = policyExactMatch.toList().where(\elt -> elt.ID != minERRunPolicyID)
          for (otherPolicy in otherPolicyDetails) {
            _logger.info("aggregatedPolicyResult [split 5] - sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} current minPolicyDetail with Total LE: ${otherPolicy.ERRunLevyPayer.ACCPolicyID_ACC} |CUCode: ${otherPolicy.ERParamCU.CUCode} |LevyYear: ${otherPolicy.LevyYear} | sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} |LE: ${otherPolicy.LiableEarnings} |Levy: ${otherPolicy.LevyDue}")
            gw.transaction.Transaction.runWithNewBundle(\bundle -> {
              var oRunPolicyDetail = bundle.add(otherPolicy)
              oRunPolicyDetail.LiableEarnings = BigDecimal.ZERO
              oRunPolicyDetail.LevyDue = BigDecimal.ZERO
            }, "sys")
            otherPolicy.refresh()
            _logger.info("aggregatedPolicyResult [split 5] - sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} update NON-minPolicyDetail with zero LE: ${otherPolicy.ERRunLevyPayer.ACCPolicyID_ACC} |CUCode: ${otherPolicy.ERParamCU.CUCode} |LevyYear: ${otherPolicy.LevyYear} |LE: 0.00 |Levy: 0.00")
          }

          //Split: 6.) Create new Buyer Policy that is NOT the oldest ID by setting LE and Levy to ZERO
          var buyerLevyPayer = _erProcessUtils.getRunLevyPayer(erRun, transferBuyer.ACCPolicyID_ACC)
          var buyerLiableEarnings = transferPolicy.LiableEarningsAmount.setScale(2, RoundingMode.HALF_UP)
          var levyRatio = BigDecimal.ZERO
          if (minPolicyDetail.LiableEarnings > 0) {
            levyRatio = (buyerLiableEarnings / minPolicyDetail.LiableEarnings).setScale(8, RoundingMode.HALF_UP)
          }
          var buyerLevyDue = (minPolicyDetail.LevyDue * levyRatio).setScale(2, RoundingMode.HALF_UP)

          // create buyer ERRunPolicyDetail based on split transfer liable Earnings and prorated Levy
          var erPolicyValues = loadERPolicyValues(minPolicyDetail.BranchID, transferPolicy.CUCode)
          if (erPolicyValues != null) {
            erPolicyValues.liableEarnings = buyerLiableEarnings
            erPolicyValues.levyDue = buyerLevyDue
            erPolicyValues.originalERRunLevyPayer = sellerLevyPayer
            erPolicyValues.erRunLevyPayer = buyerLevyPayer
            _erProcessUtils.createERRunPolicyDetail(erPolicyValues, transfer)
            _logger.info("aggregatedPolicyResult [split 6] - sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} update NON-minPolicyDetail with zero LE: ${buyerLevyPayer.ACCPolicyID_ACC} |CUCode: ${transferPolicy.CUCode} |LevyYear: ${transferPolicy.LevyYear} |LE: ${buyerLiableEarnings} |Levy: ${buyerLevyDue}")
          }

          //Split: 7.) Update Seller Policy with oldest ID by deducting the Buyer LE and Levy
          _logger.info("aggregatedPolicyResult [split 7] - sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} update minPolicyDetail with remaining LE: ${minPolicyDetail.ERRunLevyPayer.ACCPolicyID_ACC} |CUCode: ${minPolicyDetail.ERParamCU.CUCode} |LevyYear: ${minPolicyDetail.LevyYear} |LE: ${minPolicyDetail.LiableEarnings} |Levy: ${minPolicyDetail.LevyDue}")
          var remainingLiableEarnings = minPolicyDetail.LiableEarnings.toMonetaryAmount() - buyerLiableEarnings
          var remainingLevyDue = minPolicyDetail.LevyDue - buyerLevyDue
          _logger.info("aggregatedPolicyResult [split 7] - sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} update policy details  ${minPolicyDetail.ERRunLevyPayer.ACCPolicyID_ACC}")
          gw.transaction.Transaction.runWithNewBundle(\bundle -> {
            var oRunPolicyDetail = bundle.add(minPolicyDetail)
            oRunPolicyDetail.ERTransfer = transfer
            oRunPolicyDetail.LiableEarnings = remainingLiableEarnings
            oRunPolicyDetail.LevyDue = remainingLevyDue
          }, "sys")
          minPolicyDetail.refresh()
          _logger.info("aggregatedPolicyResult [split 7] - sellerLevyPayer ${sellerLevyPayer.ACCPolicyID_ACC} update minPolicyDetail with remaining LE: ${minPolicyDetail.ERRunLevyPayer.ACCPolicyID_ACC} |CUCode: ${minPolicyDetail.ERParamCU.CUCode} |LevyYear: ${minPolicyDetail.LevyYear} |LE: ${remainingLiableEarnings} |Levy: ${remainingLevyDue}")
        }
      }
    }
  }

  function getAggregatedPolicyBySeller(erRun : ERRun_ACC, sellerLevyPayer : ERRunLevyPayer_ACC, erParamCU : ERParamCU_ACC, levyYear : Integer) : IQueryResult<ERRunPolicyDetail_ACC, QueryRow> {
    var minERRunPolicyID = QuerySelectColumns.dbFunctionWithAlias("minERRunPolicyID",
        DBFunction.Min(Paths.make(ERRunPolicyDetail_ACC#ID)))
    var sumLiableEarnings = QuerySelectColumns.dbFunctionWithAlias("SumLiableEarnings",
        DBFunction.Sum(Paths.make(ERRunPolicyDetail_ACC#LiableEarnings)))
    var sumLevyDue = QuerySelectColumns.dbFunctionWithAlias("SumLevyDue",
        DBFunction.Sum(Paths.make(ERRunPolicyDetail_ACC#LevyDue)))

    var queryPolicyDetail = Query.make(ERRunPolicyDetail_ACC)
        .compare(ERRunPolicyDetail_ACC#ERRun, Relop.Equals, erRun)
        .compare(ERRunPolicyDetail_ACC#ERRunLevyPayer, Relop.Equals, sellerLevyPayer)
        .compare(ERRunPolicyDetail_ACC#ERParamCU, Relop.Equals, erParamCU)
        .compare(ERRunPolicyDetail_ACC#LevyYear, Relop.Equals, levyYear)
    return queryPolicyDetail.select({
        QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunPolicyDetail_ACC#ERRun)),
        QuerySelectColumns.pathWithAlias("ACCPolicyID", Paths.make(ERRunPolicyDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ACCPolicyID_ACC)),
        QuerySelectColumns.pathWithAlias("CUCode", Paths.make(ERRunPolicyDetail_ACC#ERParamCU, ERParamCU_ACC#CUCode)),
        QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunPolicyDetail_ACC#LevyYear)),
        minERRunPolicyID,
        sumLiableEarnings,
        sumLevyDue
    })
  }

  function getPolicyBaseQuery(erRun : ERRun_ACC, levyPayer : ERRunLevyPayer_ACC) : Query<ERRunPolicyDetail_ACC> {
    var queryBase = Query.make(ERRunPolicyDetail_ACC)
    queryBase.compare(ERRunPolicyDetail_ACC#ERRun, Relop.Equals, erRun)
    queryBase.compare(ERRunPolicyDetail_ACC#ERRunLevyPayer, Relop.Equals, levyPayer)
    return queryBase
  }

  function getExactMatch(erRun : ERRun_ACC, sellerLevyPayer : ERRunLevyPayer_ACC,
                         erParamCU : ERParamCU_ACC, levyYear : Integer) : Iterator<ERRunPolicyDetail_ACC> {
    var queryPolicy = getPolicyBaseQuery(erRun, sellerLevyPayer)
    queryPolicy.compare(ERRunPolicyDetail_ACC#ERParamCU, Relop.Equals, erParamCU)
    queryPolicy.compare(ERRunPolicyDetail_ACC#LevyYear, Relop.Equals, levyYear)
    return queryPolicy.select().iterator()
  }

  function getDummyPolicy(erRun : ERRun_ACC, sellerLevyPayer : ERRunLevyPayer_ACC,
                          erParamCU : ERParamCU_ACC, levyYear : Integer) : ERRunPolicyDetail_ACC {
    var queryPolicy = getPolicyBaseQuery(erRun, sellerLevyPayer)
    var result : ERRunPolicyDetail_ACC

    var levyPayerMatch = queryPolicy.select().first()
    if (levyPayerMatch != null) {
      // Check 1st option - with matching CUCode
      result = queryPolicy.select().iterator().toList().firstWhere(\elt ->
          elt.ERParamCU == erParamCU
      )
      if (result != null)
        return result

      // Check 2nd option - with matching Levy Year
      result = queryPolicy.select().iterator().toList().firstWhere(\elt ->
          elt.LevyYear == levyYear
      )
      if (result != null)
        return result

      // return 3rd option - matching Levy Payer only
      return levyPayerMatch
    }
    return null
  }

  function createDummyPolicy(transfer : ERTransfer_ACC, erRun : ERRun_ACC, sellerLevyPayer : ERRunLevyPayer_ACC,
                             oCUCode : ERParamCU_ACC, levyYear : Integer) {
    //Split: 1.) Look for seller's Policy with matching CUCode and LevyYear
    var policyExactMatch = getExactMatch(erRun, sellerLevyPayer, oCUCode, levyYear)

    //Split: 2.) if Seller does not have exact match Policy create new Policy Detail record
    // based on Policy with the same ACCPolicyID & CUCode(1), ACCPolicyID & LevyYear(2) or just ACCPolicyID(3)
    if (!policyExactMatch.hasNext()) {
      var dummyPolicy = getDummyPolicy(erRun, sellerLevyPayer, oCUCode, levyYear)
      if (dummyPolicy != null) {
        // create dummy seller ERRunPolicyDetail record with ZERO liable Earnings and Levy
        var dummyERPolicyValues = loadERPolicyValues(dummyPolicy.BranchID, oCUCode.CUCode)
        if (dummyERPolicyValues != null) {
          dummyERPolicyValues.originalERRunLevyPayer = sellerLevyPayer
          dummyERPolicyValues.erRunLevyPayer = sellerLevyPayer
          _erProcessUtils.createERRunPolicyDetail(dummyERPolicyValues, transfer)
          _logger.info("createDummyPolicy: ${sellerLevyPayer.ACCPolicyID_ACC} |CUCode: ${oCUCode.CUCode} |LevyYear: ${levyYear} |LE: 0.00")
        }
      }
    }
  }

  function loadERPolicyValues(branchID : Long, cuCode : String) : ERRunPolicyValues {
    var policyPeriod = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#ID, Relop.Equals, new Key(PolicyPeriod, branchID))
        .select().FirstResult.LatestPeriod
    if (policyPeriod != null) {
      var erRunPolicyValues = new ERRunPolicyValues()
      erRunPolicyValues.branchID = policyPeriod.ID.Value
      erRunPolicyValues.levyYear = policyPeriod.LevyYear_ACC
      erRunPolicyValues.periodStart = policyPeriod.PeriodStart
      erRunPolicyValues.periodEnd = policyPeriod.PeriodEnd
      erRunPolicyValues.liableEarnings = BigDecimal.ZERO
      erRunPolicyValues.levyDue = BigDecimal.ZERO
      erRunPolicyValues.isCpx = Boolean.FALSE
      erRunPolicyValues.isShareholderLE = Boolean.FALSE
      erRunPolicyValues.cuCode = cuCode
      erRunPolicyValues.isAEPMember = false
      erRunPolicyValues.isAudit = policyPeriod.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE
      erRunPolicyValues.isWPSOrWPCPolicy = policyPeriod.EMPWPCLineExists or policyPeriod.CWPSLineExists
      return erRunPolicyValues
    }
    return null
  }
}