package nz.co.acc.gwer.batch

uses gw.api.database.Query
uses gw.api.database.QueryRow
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses nz.co.acc.gwer.ERRunParameter

class ERTransferClaimDetails_ACC extends WorkQueueBase<ERRunLevyPayer_ACC, StandardWorkItem> {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERTransferClaimDetails_ACC)
  private var _erProcessUtils : ERProcessUtils_ACC
  construct () {
    super(BatchProcessType.TC_ERTRANSFERCLAIMDETAILS_ACC, StandardWorkItem, ERRunLevyPayer_ACC)
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
    _logger.info("ERTransferClaimDetails_ACC started ACCPolicyID: " + levyPayer.ACCPolicyID_ACC)
    var erRunParam = new ERRunParameter(levyPayer.ERRun.ERRequest.LevyYear)
    // get transfer records where Seller is the target Levy Payer
    var transferItems = _erProcessUtils.getERTransferBaseQuery(levyPayer.ERRun.ERRequest.LevyYear)
        .compare(ERTransfer_ACC#SellerACCPolicyID, Relop.Equals, levyPayer.ACCPolicyID_ACC)
        .select().iterator()
    for (transfer in transferItems) {
      applyTransfer(transfer, levyPayer)
    }
    _logger.info("ERTransferClaimDetails_ACC ended ACCPolicyID: " + levyPayer.ACCPolicyID_ACC)
  }

  function applyTransfer(transfer : ERTransfer_ACC, sellerLevyPayer : ERRunLevyPayer_ACC) {
    var erRun = sellerLevyPayer.ERRun
    var transferBuyer = _erProcessUtils.getTransferBuyer(transfer)
    var buyerLevyPayer = _erProcessUtils.getRunLevyPayer(erRun, transferBuyer.ACCPolicyID_ACC)
    _logger.info("${transfer.ERTransferType.Name} ER Transfer apply to Buyer: ${transferBuyer.ACCPolicyID_ACC} |StartDate: ${transfer.TransferStartDate.toString()} |TransferDate: ${transfer.TransferDate.toString()}")
    var transferClaimNumber : String[]
    // if Split transfer get list of all buyer ClaimNumbers
    if (transfer.ERTransferType == ERTransferType_ACC.TC_SPL) {
      transferClaimNumber = Query.make(ERTransferClaim_ACC)
          .compare(ERTransferClaim_ACC#ERTransferBuyer, Relop.Equals, transferBuyer)
          .select()*.ClaimNumber
    }
    // get run claim details that belongs to seller and injury date within transfer period
    var queryClaim = Query.make(ERRunClaimDetail_ACC)
        .compare(ERRunClaimDetail_ACC#ERRun, Relop.Equals, erRun)
//        .compare(ERRunClaimDetail_ACC#ACCPolicyID_ACC, Relop.Equals, sellerLevyPayer.ACCPolicyID_ACC)
        .compare(ERRunClaimDetail_ACC#ERRunLevyPayer, Relop.Equals, sellerLevyPayer)
        .compare(ERRunClaimDetail_ACC#InjuryDate, Relop.GreaterThanOrEquals, transfer.TransferStartDate)
    if (transfer.TransferDate != null) {
      queryClaim.compare(ERRunClaimDetail_ACC#InjuryDate, Relop.LessThanOrEquals, transfer.TransferDate)
    }
    // if SPLIT transfer add condition to specific ClaimNumber
    if (transfer.ERTransferType == ERTransferType_ACC.TC_SPL) {
      queryClaim.compareIn(ERRunClaimDetail_ACC#ClaimNumber, transferClaimNumber)
    }
//    print(queryClaim.toString())
    var claimItems = queryClaim.select()
    for (claimDetail in claimItems) {
      _logger.info("[RunClaim] ${claimDetail.ERRunLevyPayer.ACCPolicyID_ACC} |Buyer: ${transferBuyer.ACCPolicyID_ACC} |ClaimNumber: ${claimDetail.ClaimNumber} |CUCode: ${claimDetail.DerivedERParamCU.CUCode}")
      // replace the seller LevyPayer of the Run PolicyDetail with the buyer LevyPayer
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var oRunClaimDetail = bundle.add(claimDetail)
        oRunClaimDetail.ERTransfer = transfer
        oRunClaimDetail.ERRunLevyPayer = buyerLevyPayer
      }, "sys")
      claimDetail.refresh()
    }
  }
}