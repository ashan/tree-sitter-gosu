package nz.co.acc.gwer.batch

uses gw.processes.WorkQueueBase
uses gw.api.database.Relop
uses gw.api.database.Query
uses gw.api.database.InOperation
uses gw.pl.persistence.core.Key
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.ERRunParameter
uses nz.co.acc.gwer.ERRunPolicyValues
uses nz.co.acc.gwer.util.ERProcessUtils_ACC

uses java.math.BigDecimal

class ERGeneratePolicyDetails_ACC extends WorkQueueBase<ERRunLevyPayer_ACC, StandardWorkItem> {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERGeneratePolicyDetails_ACC)
  private var _erProcessUtils : ERProcessUtils_ACC

  construct() {
    super(BatchProcessType.TC_ERGENERATEPOLICYDETAILS_ACC, StandardWorkItem, ERRunLevyPayer_ACC)
    this._erProcessUtils = new ERProcessUtils_ACC()
  }

  override function findTargets() : Iterator<ERRunLevyPayer_ACC> {
    var queryLevyPayer = Query.make(ERRunLevyPayer_ACC)
    queryLevyPayer.join(ERRunLevyPayer_ACC#ERRun)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
    return queryLevyPayer.select().iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    try {
      var levyPayer = extractTarget(item)
      _logger.info("ACCPolicyID: " + levyPayer?.ACCPolicyID_ACC
          + " | BusinessGroup: " + levyPayer?.ERBusinessGroup?.BusinessGroupID)
      var erRunParam = new ERRunParameter(levyPayer.ERRun.ERRequest.LevyYear)
      var listExpYears = _erProcessUtils.getTargetYears(erRunParam, Boolean.FALSE)

      // get policy period of LevyPayer ACCPolicyID for Run levyYear
      var currentPolicyTerm = _erProcessUtils.getPolicyTermByACCPolicyIDAndLevyYear(levyPayer?.ACCPolicyID_ACC, levyPayer.ERRun.ERRequest.LevyYear).FirstResult
      var currentPolicyPeriod : PolicyPeriod = null
      if(currentPolicyTerm != null) {
        _logger.info("processWorkItem currentPolicyTerm LatestBranchID_ACC ${currentPolicyTerm.LatestBranchID_ACC}")
        currentPolicyPeriod = Query.make(PolicyPeriod)
          .compare(PolicyPeriod#ID, Relop.Equals, new Key(PolicyPeriod, currentPolicyTerm.LatestBranchID_ACC))
          .select().FirstResult
      } else {
        _logger.info("processWorkItem currentPolicyTerm is null")
      }

      // check if LevyPayer is full year AEP Member on Run Levy Year
      var currentFullYearAEPMember = currentPolicyPeriod != null ? currentPolicyPeriod.IsFullYearAEPMember : false
      _logger.info("processWorkItem currentFullYearAEPMember ${currentFullYearAEPMember}")

      // get policy period of LevyPayer ACCPolicyID for Exp Levy Years
      var queryPolicyTerm = Query.make(PolicyTerm)
          .compare(PolicyTerm#HasLEorLevies_ACC, Relop.Equals, Boolean.TRUE)
          .compare(PolicyTerm#ACCPolicyID_ACC, Relop.Equals, levyPayer.ACCPolicyID_ACC)
          .compare(PolicyTerm#Cancelled_ACC, Relop.Equals, Boolean.FALSE)
          .compareIn(PolicyTerm#LevyYear_ACC, listExpYears)
          .select()
      for (term in queryPolicyTerm) {
        var period = Query.make(PolicyPeriod)
            .compare(PolicyPeriod#ID, Relop.Equals, new Key(PolicyPeriod, term.LatestBranchID_ACC))
            .select().FirstResult
        if (period != null) {
          period = period.getSlice(period.EditEffectiveDate)
          var cuCodeSet = period.getPolicyLineBICCodes()*.CUCode
          // loop through each CUCode per policy period
          for (cuCode in cuCodeSet) {
            var erPolicyValues = loadERPolicyValues(period, currentFullYearAEPMember, cuCode)
            if (!currentFullYearAEPMember) {
              // if LevyPayer is full/part year AEP Member on Exp Levy Year
              if(period.IsAEPMemberPolicy_ACC) {
                // set LE and Levy with Simulated values for the Exp Levy Year
                if(period.EMPWPCLineExists) {
                  erPolicyValues.liableEarnings = period.EMPWPCLine.getTotalLiableEarningsByCUCode(cuCode)
                } else if(period.CWPSLineExists) {
                  erPolicyValues.liableEarnings = period.CWPSLine.getTotalLiableEarningsByCUCode(cuCode)
                }
                _logger.info("processWorkItem accPolicyID ${period.ACCPolicyID_ACC} cuCode ${cuCode} startDate ${period.PeriodStart} endDate ${period.PeriodEnd}")
                var cuRate = _erProcessUtils.getWorkAccountLevyRateByCUCode(cuCode, period.PeriodStart, period.PeriodEnd)
                erPolicyValues.levyDue = erPolicyValues.liableEarnings * (cuRate > 0 ? (cuRate / 100) : 0)
                _logger.info("processWorkItem accPolicyID ${period.ACCPolicyID_ACC} cuCode ${cuCode} liableEarnings ${erPolicyValues.liableEarnings} cuRate ${cuRate} levyDue ${erPolicyValues.levyDue}")
              } else {
                if (erPolicyValues.isAudit or period.INDCoPLineExists) {
                  var walCost = _erProcessUtils.getWALCost(period, ChargePattern.TC_WAL, cuCode)
                  var bicCode = _erProcessUtils.getBICCode(period, cuCode)
                  var leLessSheOnCPX = BigDecimal.ZERO
                  if (walCost != null) {
                    erPolicyValues.levyDue = walCost*.StandardTermAmount_amt.sum()
                    if (period.CWPSLineExists) {
                      leLessSheOnCPX = (walCost as CWPSWorkAccountLevyCost).CWPSWorkAccountLevyCostItem.LeLessSheOnCPX_ACC.Amount
                    }
                    if (leLessSheOnCPX > BigDecimal.ZERO) {
                      erPolicyValues.liableEarnings = leLessSheOnCPX
                    } else {  // period is IND or WPC or WPS without leLessSheOnCPX
                      if (walCost.HasOverride) {
                        if (period.INDCoPLineExists) {
                          erPolicyValues.liableEarnings = walCost.PolicyLine.BICCodes.first().AdjustedLiableEarnings.Amount
                        } else if (period.EMPWPCLineExists) {
                          erPolicyValues.liableEarnings = (walCost as EMPWorkAccountLevyItemCost).EMPWorkAccountLevyCostItem.AdjustedLiableEarnings
                        } else if (period.CWPSLineExists) {
                          erPolicyValues.liableEarnings = (walCost as CWPSWorkAccountLevyCost).CWPSWorkAccountLevyCostItem.AdjustedLiableEarnings_amt
                        }
                      } else {  // WAL does not have override
                        erPolicyValues.liableEarnings = walCost.Basis
                      }
                    }
                  } else {  // period has NO WAL cost
                    // This is NOT needed since in loadERPolicyValues LE and Levy are defaulted to ZERO
//                    erPolicyValues.levyDue = BigDecimal.ZERO
                    erPolicyValues.liableEarnings = bicCode.AdjustedLiableEarnings
                  }
//                } else {  // period is NOT an Audit and NOT an INDCoPLine
//                  // This is NOT needed since in loadERPolicyValues LE and Levy are defaulted to ZERO
//                  erPolicyValues.levyDue = BigDecimal.ZERO
//                  erPolicyValues.liableEarnings = BigDecimal.ZERO
                }
              }
//            } else {
//              // else (LevyPayer is full year AEP Member on Run Levy Year)
//              // This is NOT needed since in loadERPolicyValues LE and Levy are defaulted to ZERO
//              erPolicyValues.levyDue = BigDecimal.ZERO
//              erPolicyValues.liableEarnings = BigDecimal.ZERO
            }

            //if CPX and has Shareholder earnings - create another Policy Details
            if (period.INDCPXLineExists) {
              createShareholderEarnings(levyPayer, erPolicyValues)
              erPolicyValues.isCpx = Boolean.TRUE
            }
            erPolicyValues.originalERRunLevyPayer = levyPayer
            erPolicyValues.erRunLevyPayer = levyPayer
            _erProcessUtils.createERRunPolicyDetail(erPolicyValues, null)
          }
        }
      }
    } catch (e : Exception) {
      _logger.error_ACC(e.Message, e)
      throw e
    }
  }

  function loadERPolicyValues(policyPeriod : PolicyPeriod, isAEPMember : Boolean , cuCode : String) : ERRunPolicyValues {
    var erRunPolicyValues = new ERRunPolicyValues()
    erRunPolicyValues.branchID = policyPeriod.ID.Value
    erRunPolicyValues.accPolicyID = policyPeriod.ACCPolicyID_ACC
    erRunPolicyValues.policyNumber = policyPeriod.PolicyNumber
    erRunPolicyValues.levyYear = policyPeriod.LevyYear_ACC
    erRunPolicyValues.periodStart = policyPeriod.PeriodStart
    erRunPolicyValues.periodEnd = policyPeriod.PeriodEnd
    erRunPolicyValues.liableEarnings = BigDecimal.ZERO
    erRunPolicyValues.levyDue = BigDecimal.ZERO
    erRunPolicyValues.isCpx = Boolean.FALSE
    erRunPolicyValues.isShareholderLE = Boolean.FALSE
    erRunPolicyValues.cuCode = cuCode
    erRunPolicyValues.isAudit = policyPeriod.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE
    erRunPolicyValues.isWPSOrWPCPolicy = policyPeriod.EMPWPCLineExists or policyPeriod.CWPSLineExists
    erRunPolicyValues.isAEPMember = isAEPMember
    return erRunPolicyValues
  }

  function createShareholderEarnings(cpxLevyPayer : ERRunLevyPayer_ACC, cpxPolicyValues : ERRunPolicyValues) {
    var cpxPolicyNumber = cpxPolicyValues.policyNumber
    var cpxLevyYear = cpxPolicyValues.levyYear

    var querySheCpx = Query.make(PolicySHECPXDetails_ACC)
//        .compare(PolicySHECPXDetails_ACC#ChangeType, Relop.Equals, EffDatedChangeType.TC_SLICE)
        .compare(PolicySHECPXDetails_ACC#shareAdjLE_amt, Relop.NotEquals, null)
        .compare(PolicySHECPXDetails_ACC#shareAuditAdjLE_amt, Relop.NotEquals, null)
        .compare(PolicySHECPXDetails_ACC#ExpirationDate, Relop.Equals, null)
        .compare(PolicySHECPXDetails_ACC#policyNumber, Relop.Equals, cpxPolicyNumber)
    var queryPolicyTerm = querySheCpx.join("Branch", PolicyTerm, "LatestBranchID_ACC") //WPS should be latest policy period
        .compare(PolicyTerm#LevyYear_ACC, Relop.Equals, cpxLevyYear) //WPS LevyYear should be the same as CPX levyYear


    var querySheEarnings = Query.make(ShareholderEarnings_ACC)
        .compare(ShareholderEarnings_ACC#ExpirationDate, Relop.Equals, null)
    var queryShareholder = querySheEarnings.join("Branch", entity.PolicyContactRole, "Branch")
        .compare(entity.PolicyContactRole#Fixed, Relop.Equals, querySheEarnings.getColumnRef("ShareholderID"))
        .compare(entity.PolicyContactRole#Subtype, Relop.Equals, typekey.PolicyContactRole.TC_POLICYSHAREHOLDER_ACC)
        .compare(entity.PolicyContactRole#ExpirationDate, Relop.Equals, null)
    querySheEarnings.subselect("Branch", InOperation.CompareIn, querySheCpx, "Branch")
    querySheEarnings.subselect("ShareholderID", InOperation.CompareIn, querySheCpx, "PolicyShareholder")

    var results = querySheEarnings.select()
    for (sheEarnings in results) {
      if (sheEarnings.Branch.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE) {
//      print(sheEarnings.CUCode + '|' + sheEarnings.LiableEarnings_amt)
        var shePolicyValues = loadERPolicyValues(sheEarnings.Branch, false, sheEarnings.CUCode)
        shePolicyValues.isShareholderLE = Boolean.TRUE
        shePolicyValues.liableEarnings = sheEarnings.LiableEarnings_amt
        shePolicyValues.originalERRunLevyPayer = cpxLevyPayer
        shePolicyValues.erRunLevyPayer = cpxLevyPayer
        _erProcessUtils.createERRunPolicyDetail(shePolicyValues, null)
      }
    }
  }
}
