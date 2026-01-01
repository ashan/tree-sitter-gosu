package nz.co.acc.er.batch

uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.database.Query
uses gw.api.path.Paths
uses gw.processes.BatchProcessBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.ERSearchResultsCounter_ACC
uses nz.co.acc.er.businessgroup.BusinessGroupSearchCriteria_ACC
uses nz.co.acc.er.request.ERRunRequest_ACC
uses nz.co.acc.er.request.RequestGroupType_ACC
uses nz.co.acc.er.request.RequestReason_ACC
uses nz.co.acc.er.request.RequestType_ACC
uses nz.co.acc.lob.common.DateUtil_ACC

class ERRecalcBatch_ACC extends BatchProcessBase {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERRecalcBatch_ACC)

  /**
   * Constructor
   */
  construct() {
    super(BatchProcessType.TC_ERRECALCREQUEST_ACC)
  }

  protected override function doWork() {
    var results = Query.make(PolicyTerm)
                       .compare(PolicyTerm#ERRecalcRequired_ACC, Relop.Equals, Boolean.TRUE)
                       .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.Equals, DateUtil_ACC.currentLevyYear())
                       .withDistinct(true)
                       .select({
                           QuerySelectColumns.pathWithAlias("AEPFinancialYear_ACC", Paths.make(PolicyTerm#AEPFinancialYear_ACC))})

    results.each(\elt -> {
      createERRequest(elt.getColumn(0) as Integer)
    })
  }

  function createERRequest(levyYear : Integer) {
    try {
      var policyTerm = Query.make(PolicyTerm)
          .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.Equals, levyYear)
          .compare(PolicyTerm#ERRecalcRequired_ACC, Relop.Equals, Boolean.TRUE)
          .compare(PolicyTerm#AEPProductCode_ACC, Relop.Equals, "EmployerACC")
          .withDistinct(true)
          .select()

      if(policyTerm.Count > 0) {
        var accPolicyIDSB = new StringBuilder()
        policyTerm.each(\elt -> {
          var accPolicyID = elt.AEPACCNumber_ACC + "E"
          accPolicyIDSB.append(accPolicyID)
          accPolicyIDSB.append(',')
        })

        accPolicyIDSB.deleteCharAt(accPolicyIDSB.length() - 1)
        var accPolicyIDs = accPolicyIDSB.toString()
        var requestReason = new RequestReason_ACC().retrieveAll().firstWhere(\elt -> elt.RequestReasonCode.equals("LEI"))
        _logger.debug("RequestReason ${requestReason.RequestReasonCode}")
        var requestType = new RequestType_ACC().retrieveAll().firstWhere(\elt -> elt.RequestTypeCode.equals("REC"))
        _logger.debug("RequestType ${requestType.RequestTypeCode}")
        var requestGroupType = new RequestGroupType_ACC().retrieveAll().firstWhere(\elt -> elt.RequestGroupTypeCode.equals("SEL"))
        _logger.debug("RequestGroupType ${requestGroupType.RequestGroupTypeCode}")

        if(requestReason != null and requestType != null and requestGroupType != null) {
          var erRequest = new ERRunRequest_ACC()
          erRequest.Creator = User.util.UnrestrictedUser.DisplayName
          erRequest.LevyYear = levyYear
          erRequest.RequestType = requestType
          erRequest.RequestGroupType = requestGroupType

          if(accPolicyIDs.HasContent) {
            var bsgSearch = new BusinessGroupSearchCriteria_ACC()
            bsgSearch.ACCPolicyIDList = accPolicyIDs
            bsgSearch.LevyYear = levyYear
            var resultsCounter = new ERSearchResultsCounter_ACC()
            var results = bsgSearch.performSearchFromACCPolicyIDsWithResultLimit(resultsCounter, 1)

            if(results.HasElements) {
              results.each(\elt -> {
                if(elt.BusinessGroupID != null and
                    !erRequest.RequestTargets.hasMatch(\elt1 -> elt1.BusinessGroupID == elt.BusinessGroupID)) {
                  createRequestTarget(erRequest, elt.BusinessGroupID, null, requestReason)
                } else if(!erRequest.RequestTargets.hasMatch(\elt1 -> elt1.ACCPolicyID == elt.ACCPolicyID)){
                  createRequestTarget(erRequest, null, elt.ACCPolicyID, requestReason)
                }
              })
            }
            erRequest.RequestDecision = new nz.co.acc.er.request.RequestDecision_ACC().getDecisionOptions().first()
            erRequest.create()
            erRequest.update()
            policyTerm.each(\elt -> {
              gw.transaction.Transaction.runWithNewBundle(\bundle -> {
                var newPolicyTerm = bundle.add(elt)
                newPolicyTerm.ERRecalcRequired_ACC = false
              }, User.util.UnrestrictedUser)
            })
          }
        }
      }
    } catch(e: Exception) {
      _logger.error_ACC(e.getMessage())
    }
  }

  function createRequestTarget(erRequest:ERRunRequest_ACC, businessGroupID:Integer, accPolicyID:String,
                               requestReason : RequestReason_ACC) {
    var target = erRequest.createtRequestTarget()
    _logger.debug("Creating request target for accPolicyID ${accPolicyID} businessGroupID ${accPolicyID}")

    target.RequestReason = requestReason
    if(businessGroupID != null) {
      _logger.debug("BusinessGroupID ${businessGroupID}")
      target.BusinessGroupID = businessGroupID
    } else {
      _logger.debug("accPolicyID ${accPolicyID}")
      target.ACCPolicyID = accPolicyID
    }
    target.RequestReasonDetails = "Recalc request due to CARA load"
  }
}