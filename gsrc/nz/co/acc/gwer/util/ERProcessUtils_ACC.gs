package nz.co.acc.gwer.util

uses gw.api.database.IQueryBeanResult
uses gw.api.database.IQueryResult
uses gw.api.database.Query
uses gw.api.database.QueryRow
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.database.DBFunction
uses gw.api.database.InOperation
uses gw.api.path.Paths
uses gw.pl.persistence.core.Key
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.ERRunClaimValues
uses nz.co.acc.gwer.ERRunExperienceClaims
uses nz.co.acc.gwer.ERRunExperienceLEandLevy
uses nz.co.acc.gwer.ERRunParameter
uses nz.co.acc.gwer.ERRunPolicyValues
uses nz.co.acc.gwer.ERRunValidationCounter
uses nz.co.acc.lob.common.DateUtil_ACC
uses typekey.Job
uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.Bundle

uses java.math.BigDecimal
uses java.math.RoundingMode
uses java.nio.charset.StandardCharsets
uses java.util.Base64
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

class ERProcessUtils_ACC {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERProcessUtils_ACC)
  function HasLEorLevies(period : PolicyPeriod) : Boolean {
    var hasWalAmount = period?.AllCosts?.where(\elt -> elt.ChargePattern == ChargePattern.TC_WAL)?.sum(\elt -> elt.ActualAmount_amt).IsZero == false
    if(hasWalAmount or period.INDCPXLineExists) {
      return Boolean.TRUE
    } else {
      if(period.EMPWPCLineExists) {
        return period.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov.AdjustedLiableEarnings_amt.IsZero == false
      } else if(period.CWPSLineExists ) {
        var earnings = period.CWPSLine.PolicyShareholders.arrays("ShareholderEarnings") as List<ShareholderEarnings_ACC>
        if (period.Audit.IsAudit_ACC) {
          return earnings.sum(\elt -> elt.AuditAdjustedLELessCpx).IsPositive
        } else {
          return earnings.sum(\elt -> elt.AdjustedLELessCpx).IsPositive
        }
      } else if(period.INDCoPLineExists) {
        return period.INDCoPLine.INDCoPCovs.first().CurrentLiableEarnings.AdjustedLiableEarnings_amt.IsZero == false
      }
    }
    return Boolean.FALSE
  }

  function getBusinessGroupMembers(erRunParam : ERRunParameter, listERBusinessGroup : ERBusinessGroup_ACC[], listACCPolicyID : String[]) : ERBusinessGroupMember_ACC[] {
    var runPeriodStart = erRunParam.periodStart
    var runPeriodEnd = erRunParam.periodEnd

    var queryMember = Query.make(ERBusinessGroupMember_ACC)
    if (listACCPolicyID != null) {
      queryMember.compareIn(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, listACCPolicyID)
    }
    if (listERBusinessGroup != null) {
      queryMember.compareIn(ERBusinessGroupMember_ACC#ERBusinessGroup, listERBusinessGroup)
    }

    queryMember.or(\orQry -> {
      orQry.and(\orStart -> {
        orStart.compare(ERBusinessGroupMember_ACC#MembershipStart, Relop.LessThanOrEquals, runPeriodStart)
        orStart.or(\orNulls -> {
          orNulls.compare(ERBusinessGroupMember_ACC#MembershipEnd, Relop.GreaterThanOrEquals, runPeriodStart)
          orNulls.compare(ERBusinessGroupMember_ACC#MembershipEnd, Relop.Equals, null)
        })
      })
      orQry.and(\orEnd -> {
        orEnd.compare(ERBusinessGroupMember_ACC#MembershipStart, Relop.LessThanOrEquals, runPeriodEnd)
        orEnd.or(\orNulle -> {
          orNulle.compare(ERBusinessGroupMember_ACC#MembershipEnd, Relop.GreaterThanOrEquals, runPeriodEnd)
          orNulle.compare(ERBusinessGroupMember_ACC#MembershipEnd, Relop.Equals, null)
        })
      })
      orQry.and(\orOver -> {
        orOver.compare(ERBusinessGroupMember_ACC#MembershipStart, Relop.GreaterThan, runPeriodStart)
        orOver.compare(ERBusinessGroupMember_ACC#MembershipEnd, Relop.LessThan, runPeriodEnd)
      })
    })
    return queryMember.select().toTypedArray()
  }

  function getERTransferCounterparty(erRun : ERRun_ACC, listACCPolicyID : String[], excludeRunLevyPayer : Boolean) : String[] {
    var runLevyYear = erRun.ERRequest.LevyYear
    var listTransferCounterparty = new ArrayList<String>()
    if (listACCPolicyID.length == 0) {
      // get all buyers in all transfer(sellers)
      var allQry = Query.make(ERTransferBuyer_ACC)
          .subselect("ERTransfer", InOperation.CompareIn, getERTransferBaseQuery(runLevyYear), "ID")
          .select()
      var allSeller = allQry*.ERTransfer*.SellerACCPolicyID.toSet()
      var allBuyer = allQry*.ACCPolicyID_ACC.toSet()

      //NO filter: add all buyers then add sellers that does not yet exists
      listTransferCounterparty.addAll(allBuyer)
      listTransferCounterparty.addAll(allSeller.where(\elt ->
          listTransferCounterparty.contains(elt) == false)
      )
    } else {
      // get all buyers where seller is in given list of ACCPolicyID
      var qryBuyerFltrSeller = Query.make(ERTransferBuyer_ACC)
          .and(\andQry -> {
            andQry.subselect("ERTransfer", InOperation.CompareIn, getERTransferBaseQuery(runLevyYear)
                .compareIn(ERTransfer_ACC#SellerACCPolicyID, listACCPolicyID)
                , "ID")
            if (excludeRunLevyPayer) {
              andQry.subselect("ACCPolicyID_ACC", InOperation.CompareNotIn,
                  Query.make(ERRunLevyPayer_ACC).compare(ERRunLevyPayer_ACC#ERRun, Relop.Equals, erRun)
                      .compareIn(ERRunLevyPayer_ACC#ERProgramme, {ERProgramme_ACC.TC_ER, ERProgramme_ACC.TC_NCD})
                  , "ACCPolicyID_ACC")
            }
          })
      var targetBuyers = qryBuyerFltrSeller.select()*.ACCPolicyID_ACC.toSet()

      // get filtered buyer in all transfer(sellers)
      var qrySellerFltrBuyer = getERTransferBaseQuery(runLevyYear)
      qrySellerFltrBuyer.join(ERTransferBuyer_ACC#ERTransfer)
          .compareIn(ERTransferBuyer_ACC#ACCPolicyID_ACC, listACCPolicyID)
      if (excludeRunLevyPayer) {
        qrySellerFltrBuyer.subselect("SellerACCPolicyID", InOperation.CompareNotIn,
            Query.make(ERRunLevyPayer_ACC).compare(ERRunLevyPayer_ACC#ERRun, Relop.Equals, erRun)
                .compareIn(ERRunLevyPayer_ACC#ERProgramme, {ERProgramme_ACC.TC_ER, ERProgramme_ACC.TC_NCD})
            , "ACCPolicyID_ACC")
      }
      var targetSellers = qrySellerFltrBuyer.select()*.SellerACCPolicyID.toSet()

      //WITH filter: add buyers that is not in filter
      // then add sellers that does not exists AND is not in filter
      var setACCPolicyID = listACCPolicyID.toSet()
      listTransferCounterparty.addAll(targetBuyers.where(\elt ->
          setACCPolicyID.contains(elt) == false)
      )
      listTransferCounterparty.addAll(targetSellers.where(\elt ->
          setACCPolicyID.contains(elt) == false
              and listTransferCounterparty.contains(elt) == false)
      )
    }
    return listTransferCounterparty.asArrayOf(String)
  }

  property get TransferCounterpartyList() : String[] {
    var arrayTransferCounterparty = new ArrayList<String>()
    var runInProgress = Query.make(ERRun_ACC)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
        .select().toTypedArray()
    for (erRun in runInProgress) {
      var buyersAndSellers = getERTransferCounterparty(erRun, null, Boolean.FALSE).toSet()
      arrayTransferCounterparty.addAll(buyersAndSellers.where(\elt ->
          arrayTransferCounterparty.contains(elt) == false)
      )
    }
    return arrayTransferCounterparty.asArrayOf(String)
  }

  function getERRunCalcResultCounterparty(erRun : ERRun_ACC) : String[] {
    var listERRunCalcResultCounterparty = Query.make(ERRunCalcResult_ACC)
        .compare(ERRunCalcResult_ACC#ERRun, Relop.Equals, erRun)
        .compare(ERRunCalcResult_ACC#ACCPolicyID_ACC, Relop.NotEquals, null)
        .compareIn(ERRunCalcResult_ACC#ERProgramme, {ERProgramme_ACC.TC_ER, ERProgramme_ACC.TC_NCD})
        .select()*.ACCPolicyID_ACC.toSet()
    var queryRunLevyPayer = Query.make(ERRunLevyPayer_ACC)
        .compare(ERRunLevyPayer_ACC#ERRun, Relop.Equals, erRun)
    queryRunLevyPayer.join("ERBusinessGroup", ERRunCalcResult_ACC, "ERBusinessGroup")
        .compare(ERRunCalcResult_ACC#ERRun, Relop.Equals, queryRunLevyPayer.getColumnRef("ERRun"))
        .compareIn(ERRunCalcResult_ACC#ERProgramme, {ERProgramme_ACC.TC_ER, ERProgramme_ACC.TC_NCD})
        .compare(ERRunCalcResult_ACC#ERBusinessGroup, Relop.NotEquals, null)
    var listGroupMembers = queryRunLevyPayer.select()*.ACCPolicyID_ACC.toSet()

    listERRunCalcResultCounterparty.addAll(listGroupMembers.where(\elt ->
        listERRunCalcResultCounterparty.contains(elt) == false)
    )
    return listERRunCalcResultCounterparty.asArrayOf(String)
  }

  function getERTransferBaseQuery(runLevyYear : Integer) : Query<ERTransfer_ACC> {
    var transferPeriodEndDate = DateUtil_ACC.createDateFromString(String.valueOf(runLevyYear - 1) + "0331", "yyyyMMdd")
    var queryTransfer = Query.make(ERTransfer_ACC)
    queryTransfer.compare(ERTransfer_ACC#ERTransferStatus, Relop.Equals, ERTransferStatus_ACC.TC_APP)
    queryTransfer.compareIn(ERTransfer_ACC#ERTransferType, ERTransferType_ACC.getTypeKeys(false).toTypedArray())
    queryTransfer.compare(ERTransfer_ACC#TransferDate, Relop.LessThanOrEquals, transferPeriodEndDate)
    return queryTransfer
  }

  function getERParamLRG(lrgCode : Integer, levyApplicationYear : Integer): ERParamLRG_ACC {
    return Query.make(ERParamLRG_ACC)
        .compare(ERParamLRG_ACC#LRGCode, Relop.Equals, lrgCode)
        .compare(ERParamLRG_ACC#LevyApplicationYear, Relop.Equals, levyApplicationYear)
        .select().AtMostOneRow
  }

  function getERParamCU (cuCode : String, levyApplicationYear : Integer, levyYear : Integer) : ERParamCU_ACC {
    return Query.make(ERParamCU_ACC)
        .compareIgnoreCase(ERParamCU_ACC#CUCode, Relop.Equals, cuCode)
        .compare(ERParamCU_ACC#LevyApplicationYear, Relop.Equals, levyApplicationYear)
        .compare(ERParamCU_ACC#LevyYear, Relop.Equals, levyYear)
        .select().AtMostOneRow
  }

  function getERParamCU(cuCode : String, levyApplicationYear : Integer) : ERParamCU_ACC {
    return getERParamCU(cuCode, levyApplicationYear, levyApplicationYear)
  }

  function getERParamCUByLevyYear (cuCode : String, policyLevyYear : Integer) : ERParamCU_ACC {
    return Query.make(ERParamCU_ACC)
        .compare(ERParamCU_ACC#CUCode, Relop.Equals, cuCode)
        .compare(ERParamCU_ACC#LevyYear, Relop.Equals, policyLevyYear)
        .select().FirstResult
  }

  function getMappedERParamLRG (erCUCode : ERParamCU_ACC) : ERParamLRG_ACC {
    return Query.make(ERParamCU_LRGMapping_ACC)
        .compare(ERParamCU_LRGMapping_ACC#ERParamCU, Relop.Equals, erCUCode)
        .compare(ERParamCU_LRGMapping_ACC#IsActive, Relop.Equals, Boolean.TRUE)
        .select().AtMostOneRow.ERParamLRG
  }

  function getTargetYears(erRunParam : ERRunParameter, includeRunYear : Boolean) : Integer[] {
    var expYear = new ArrayList<Integer>()
    if (includeRunYear)
      expYear.add(erRunParam.levyYear)
    var maxYear = DateUtil_ACC.getLevyYear(erRunParam.experiencePeriodEndDate)
    var targetYear = DateUtil_ACC.getLevyYear(erRunParam.experiencePeriodStartDate)
    while (targetYear <= maxYear) {
      expYear.add(targetYear)
      targetYear++
    }
    return expYear.asArrayOf(Integer).sort()
  }

  function getERRunPolicyBaseQuery(erRun : ERRun_ACC) : Query<ERRunPolicyDetail_ACC> {
    var queryPolicy = Query.make(ERRunPolicyDetail_ACC)
    queryPolicy.compare(ERRunPolicyDetail_ACC#ERRun, Relop.Equals, erRun)
    return queryPolicy
  }


  function createERRunLevyPayer(erRun : ERRun_ACC, erBusinessGroup : ERBusinessGroup_ACC, accPolicyID : String, transferCounterparty : Boolean) {
    var oEntity : ERRunLevyPayer_ACC
    oEntity = getERRunLevyPayer(erRun, accPolicyID)
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      if (oEntity == null) {
        oEntity = new ERRunLevyPayer_ACC()
        oEntity.ERRun = erRun
        oEntity.ERBusinessGroup = erBusinessGroup
        oEntity.ACCPolicyID_ACC = accPolicyID
        oEntity.Processed = Boolean.FALSE
        oEntity.ESuffix = accPolicyID.substring(8,9)=="E" ? 1 : 0
        oEntity.DSuffix = accPolicyID.substring(8,9)=="D" ? 1 : 0
        oEntity.SSuffix = accPolicyID.substring(8,9)=="S" ? 1 : 0
        oEntity.TransferCounterparty = transferCounterparty
      } else {
        oEntity = bundle.add(oEntity)
        if (transferCounterparty) {
          oEntity.TransferCounterparty = transferCounterparty
        } else {
          oEntity.ERBusinessGroup = erBusinessGroup
        }
        oEntity.refresh()
      }
      _logger.info("Created ER Run Levy Payer")
    }, "sys")
  }

  function createERRunPolicyGroup(erRun : ERRun_ACC, erBusinessGroup : ERBusinessGroup_ACC, accPolicyID : String) {
    var oEntity : ERRunPolicyGroup_ACC
    oEntity = getERRunPolicyGroup(erRun, erBusinessGroup, accPolicyID)
    if (oEntity == null) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        oEntity = new ERRunPolicyGroup_ACC()
        oEntity.ERRun = erRun
        oEntity.ERBusinessGroup = erBusinessGroup
        if (erBusinessGroup == null)
          oEntity.ACCPolicyID_ACC = accPolicyID
        oEntity.SumLevyDueYear1 = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
        oEntity.SumLevyDueYear2 = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
        oEntity.SumLevyDueYear3 = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
        oEntity.SumLiableEarningsYear1 = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
        oEntity.SumLiableEarningsYear2 = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
        oEntity.SumLiableEarningsYear3 = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
        _logger.info("Created ER Run Policy Group")
      }, "sys")
    }
  }

  function createERRunPolicyGroupMembers(policyGroup : ERRunPolicyGroup_ACC) {
    if (policyGroup.ERBusinessGroup != null) {
      var queryLevyPayer = Query.make(ERRunLevyPayer_ACC)
          .compare(ERRunLevyPayer_ACC#ERRun, Relop.Equals, policyGroup.ERRun)
          .compare(ERRunLevyPayer_ACC#ERBusinessGroup, Relop.Equals, policyGroup.ERBusinessGroup)
          .compare(ERRunLevyPayer_ACC#TransferCounterparty, Relop.Equals, Boolean.FALSE)
          .select()
      for (levyPayer in queryLevyPayer) {
        createERRunPolicyGroup(policyGroup.ERRun, null, levyPayer.ACCPolicyID_ACC)
      }
    }
  }

  function updatePolicyGroupLEandLevy(policyGroup : ERRunPolicyGroup_ACC, expLEandLevy : ERRunExperienceLEandLevy) {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var oRunPolicyGroup = bundle.add(policyGroup)
      if (expLEandLevy.expYearYr1 != null) {
        oRunPolicyGroup.ExpLevyYear1 = expLEandLevy.expYearYr1
        oRunPolicyGroup.SumLiableEarningsYear1 = new MonetaryAmount(expLEandLevy.liableEarningsYr1, Currency.TC_NZD)
        oRunPolicyGroup.SumLevyDueYear1 = new MonetaryAmount(expLEandLevy.levyDueYr1, Currency.TC_NZD)
      }
      if (expLEandLevy.expYearYr2 != null) {
        oRunPolicyGroup.ExpLevyYear2 = expLEandLevy.expYearYr2
        oRunPolicyGroup.SumLiableEarningsYear2 = new MonetaryAmount(expLEandLevy.liableEarningsYr2, Currency.TC_NZD)
        oRunPolicyGroup.SumLevyDueYear2 = new MonetaryAmount(expLEandLevy.levyDueYr2, Currency.TC_NZD)
      }
      if (expLEandLevy.expYearYr3 != null) {
        oRunPolicyGroup.ExpLevyYear3 = expLEandLevy.expYearYr3
        oRunPolicyGroup.SumLiableEarningsYear3 = new MonetaryAmount(expLEandLevy.liableEarningsYr3, Currency.TC_NZD)
        oRunPolicyGroup.SumLevyDueYear3 = new MonetaryAmount(expLEandLevy.levyDueYr3, Currency.TC_NZD)
      }
      oRunPolicyGroup.Processed = Boolean.TRUE
    }, "sys")
    policyGroup.refresh()
  }

  function updatePolicyGroupCounters(policyGroup : ERRunPolicyGroup_ACC, validationCounter : ERRunValidationCounter) {
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var oRunPolicyGroup = bundle.add(policyGroup)
      oRunPolicyGroup.ValidYrCnt = validationCounter.expWithLEorLevy
      oRunPolicyGroup.ValidLE = validationCounter.validLE
      oRunPolicyGroup.ValidLevy = validationCounter.validLevy
    }, "sys")
    policyGroup.refresh()
  }

  function getERRunPolicyGroup(erRun : ERRun_ACC, erBusinessGroup : ERBusinessGroup_ACC, accPolicyID : String) : ERRunPolicyGroup_ACC {
    var queryPolicyGroup = Query.make(ERRunPolicyGroup_ACC)
        .compare(ERRunPolicyGroup_ACC#ERRun, Relop.Equals, erRun)
        .compare(ERRunPolicyGroup_ACC#ERBusinessGroup, Relop.Equals, erBusinessGroup)
    if (erBusinessGroup == null)
      queryPolicyGroup.compare(ERRunPolicyGroup_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
    return queryPolicyGroup.select().AtMostOneRow
  }

  function getERRunLevyPayer(erRun : ERRun_ACC, accPolicyID : String) : ERRunLevyPayer_ACC {
    return Query.make(ERRunLevyPayer_ACC)
        .compare(ERRunLevyPayer_ACC#ERRun, Relop.Equals, erRun)
        .compare(ERRunLevyPayer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        .select().AtMostOneRow
  }

  function getERRunLevyPayer(erRunCalcResult : ERRunCalcResult_ACC) : Iterator<ERRunLevyPayer_ACC> {
    return Query.make(ERRunLevyPayer_ACC)
        .compare(ERRunLevyPayer_ACC#ERRunCalcResult, Relop.Equals, erRunCalcResult)
        .select().iterator()
  }

  //  function createERRunPolicyDetail(levyPayer : ERRunLevyPayer_ACC, policyPeriod : PolicyPeriod, cuCode : String,
//                                   liableEarnings : BigDecimal, levyDue : BigDecimal, transfer : ERTransfer_ACC,
//                                   isCpx : Boolean, isShareholderLE : Boolean, isTransferBuyer : Boolean) {
  function createERRunPolicyDetail(policyValues : ERRunPolicyValues, transfer : ERTransfer_ACC) {
    _logger.info("createERRunPolicyDetail start ${policyValues.erRunLevyPayer?.ACCPolicyID_ACC}")
    var oEntity : ERRunPolicyDetail_ACC
    var oCUCode = getERParamCU(policyValues.cuCode, policyValues.erRunLevyPayer.ERRun.ERRequest.LevyYear, policyValues.levyYear)
    // check if ERRunPolicyDetail already exist only if NOT transfer buyer
    if (transfer != null) {
      oEntity = getERRunPolicyDetail(policyValues, oCUCode)
    }

    if (oCUCode != null and oEntity == null) {
      var oLRGCode = getMappedERParamLRG(oCUCode)
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        oEntity = new ERRunPolicyDetail_ACC()
        oEntity.ERRun = policyValues.erRunLevyPayer.ERRun
        oEntity.BranchID = policyValues.branchID
        oEntity.OriginalERRunLevyPayer = policyValues.originalERRunLevyPayer
        oEntity.ERRunLevyPayer = policyValues.erRunLevyPayer
        oEntity.LevyYear = policyValues.levyYear
        oEntity.PeriodStart = policyValues.periodStart
        oEntity.PeriodEnd = policyValues.periodEnd
        oEntity.ERParamCU = oCUCode
        oEntity.ERParamLRG = oLRGCode
        oEntity.ERTransfer = transfer
        oEntity.IsCpx = policyValues.isCpx
        oEntity.IsShareholderLE = policyValues.isShareholderLE
        if(transfer == null and (policyValues.isAEPMember or (policyValues.isWPSOrWPCPolicy and !policyValues.isAudit))) {
          oEntity.LiableEarnings = BigDecimal.ZERO
          oEntity.LevyDue = BigDecimal.ZERO
        } else {
          oEntity.LiableEarnings = policyValues.liableEarnings != null ? policyValues.liableEarnings.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO
          oEntity.LevyDue = policyValues.levyDue != null ? policyValues.levyDue.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO
        }
      }, "sys")
      _logger.info("Created ER Run Policy Detail ${policyValues.erRunLevyPayer?.ACCPolicyID_ACC}")
    } else if(oCUCode == null) {
      _logger.warn_ACC("Unable to create policy detail due to missing CU Code ${policyValues.erRunLevyPayer?.ACCPolicyID_ACC}, levy year : ${policyValues?.levyYear}, CUCode ${policyValues?.cuCode}")
    } else if(oEntity != null) {
      _logger.info("Policy Details already created for ${policyValues.erRunLevyPayer?.ACCPolicyID_ACC}, levy year : ${policyValues?.levyYear}")
    }
  }

  function getERRunPolicyDetail(policyValues : ERRunPolicyValues, oCUCode : ERParamCU_ACC) : ERRunPolicyDetail_ACC {
    return Query.make(ERRunPolicyDetail_ACC)
        .compare(ERRunPolicyDetail_ACC#ERRun, Relop.Equals, policyValues.erRunLevyPayer.ERRun)
        .compare(ERRunPolicyDetail_ACC#BranchID, Relop.Equals, policyValues.branchID)
        .compare(ERRunPolicyDetail_ACC#ERRunLevyPayer, Relop.Equals, policyValues.erRunLevyPayer)
        .compare(ERRunPolicyDetail_ACC#ERParamCU, Relop.Equals, oCUCode)
        .select().AtMostOneRow
  }

  function getTransferBuyer(transfer : ERTransfer_ACC) : ERTransferBuyer_ACC {
    return Query.make(ERTransferBuyer_ACC)
        .compare(ERTransferBuyer_ACC#ERTransfer, Relop.Equals, transfer)
        .select().getFirstResult()
  }

  function getRunLevyPayer(erRun : ERRun_ACC, accPolicyID : String) : ERRunLevyPayer_ACC {
    return Query.make(ERRunLevyPayer_ACC)
        .compare(ERRunLevyPayer_ACC#ERRun, Relop.Equals, erRun)
        .compare(ERRunLevyPayer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        .select().getFirstResult()
  }

  function getCPFullTimeMinEarnings(levyYear : Integer) : MonetaryAmount {
    return Query.make(ERParamMinEarnings_ACC)
        .compare(ERParamMinEarnings_ACC#LevyYear, Relop.Equals, levyYear)
        .select().getFirstResult().CPFullTimeMinEarnings
  }


  function getGroupSuffix(policyGroup : ERRunPolicyGroup_ACC) : QueryRow {
    var erRun  = policyGroup.ERRun
    var erBusinessGroup = policyGroup.ERBusinessGroup
    var accPolicyID = policyGroup.ACCPolicyID_ACC

    var sumESuffix = QuerySelectColumns.dbFunctionWithAlias("E_SuffixCount",
        DBFunction.Sum(Paths.make(ERRunLevyPayer_ACC#ESuffix)))
    var sumDSuffix = QuerySelectColumns.dbFunctionWithAlias("D_SuffixCount",
        DBFunction.Sum(Paths.make(ERRunLevyPayer_ACC#DSuffix)))
    var sumSSuffix = QuerySelectColumns.dbFunctionWithAlias("S_SuffixCount",
        DBFunction.Sum(Paths.make(ERRunLevyPayer_ACC#SSuffix)))

    var queryLevyPayer = Query.make(ERRunLevyPayer_ACC)
        .compare(ERRunLevyPayer_ACC#ERRun, Relop.Equals, erRun)
    var results : IQueryResult<ERRunLevyPayer_ACC, QueryRow>
    if (erBusinessGroup != null) {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ERBusinessGroup, Relop.Equals, erBusinessGroup)
      results = queryLevyPayer.select({
          QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunLevyPayer_ACC#ERRun)),
          QuerySelectColumns.pathWithAlias("ERBusinessGroup", Paths.make(ERRunLevyPayer_ACC#ERBusinessGroup)),
          sumESuffix, sumDSuffix, sumSSuffix
      })
    } else if (accPolicyID != null) {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ERBusinessGroup, Relop.Equals, null)
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
      results = queryLevyPayer.select({
          QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunLevyPayer_ACC#ERRun)),
          QuerySelectColumns.pathWithAlias("ACCPolicyID", Paths.make(ERRunLevyPayer_ACC#ACCPolicyID_ACC)),
          sumESuffix, sumDSuffix, sumSSuffix
      })
    }

    if(results.HasElements) {
      return results.FirstResult
    }
    return null
  }

  function createERRunCalcResult(policyGroup : ERRunPolicyGroup_ACC,
                                 erProgramme : ERProgramme_ACC, ineligibleReason : String, erMod: BigDecimal, requiresManualCalc : Boolean,
                                 manualCalcReason : String, erManualCalcStatus :  ERManualCalcStatus_ACC, erCalculationType : ERCalculationType_ACC) {
    var erRun = policyGroup.ERRun
    var erBusinessGroup = policyGroup.ERBusinessGroup
    var accPolicyID = policyGroup.ACCPolicyID_ACC
    var liableEarningsTotal = BigDecimal.ZERO
    var levyDueTotal = BigDecimal.ZERO
    if(policyGroup != null) {
      liableEarningsTotal = sumDecimalArray({
          policyGroup.SumLiableEarningsYear1_amt, policyGroup.SumLiableEarningsYear2_amt, policyGroup.SumLiableEarningsYear3_amt
      })
      levyDueTotal = sumDecimalArray({
          policyGroup.SumLevyDueYear1_amt, policyGroup.SumLevyDueYear2_amt, policyGroup.SumLevyDueYear3_amt
      })
      var levyDueTotalYear1 = policyGroup.SumLevyDueYear1
      var levyDueTotalYear2 = policyGroup.SumLevyDueYear2
      var levyDueTotalYear3 = policyGroup.SumLevyDueYear3

      var isForManualRecalc = Query.make(ERParamManualCalc_ACC)
          .compare(ERParamManualCalc_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
          .compare(ERParamManualCalc_ACC#LevyApplicationYear, Relop.Equals, erRun.ERRequest.LevyYear)
          .select().HasElements

      if(isForManualRecalc and requiresManualCalc == null and manualCalcReason == null) {
          requiresManualCalc = Boolean.TRUE
          manualCalcReason = "Levy Payer identified for manual calculation in parameter file"
      }

      var oMostRecentERCalc = getERRunCalcResultMostRecent(erRun.ERRequest.LevyYear, erBusinessGroup, accPolicyID)
      var oEntity : ERRunCalcResult_ACC
      oEntity = getERRunCalcResult(erRun, erBusinessGroup, accPolicyID)
      if (oEntity == null) {

        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          oEntity = new ERRunCalcResult_ACC()
          oEntity.ERRun = erRun
          oEntity.ERBusinessGroup = erBusinessGroup
          oEntity.ACCPolicyID_ACC = accPolicyID
          oEntity.ERProgramme = erProgramme
          oEntity.IneligibleReason = ineligibleReason
          oEntity.ERMod = erMod
          oEntity.RequiresManualCalc = requiresManualCalc
          oEntity.ManualCalcReason = manualCalcReason
          oEntity.ERManualCalcStatus = erManualCalcStatus
          oEntity.ERCalculationType = erCalculationType
          oEntity.LiableEarningsTotal = new MonetaryAmount(liableEarningsTotal, Currency.TC_NZD)
          oEntity.LevyDueTotal = new MonetaryAmount(levyDueTotal, Currency.TC_NZD)
          oEntity.LevyDueTotalYear1 = levyDueTotalYear1
          oEntity.LevyDueTotalYear2 = levyDueTotalYear2
          oEntity.LevyDueTotalYear3 = levyDueTotalYear3
          oEntity.LiableEarningsTotalYear1 = policyGroup.SumLiableEarningsYear1
          oEntity.LiableEarningsTotalYear2 = policyGroup.SumLiableEarningsYear2
          oEntity.LiableEarningsTotalYear3 = policyGroup.SumLiableEarningsYear3
          oEntity.MostRecent = Boolean.TRUE
          oEntity.LevyYear_ACC = erRun.ERRequest.LevyYear
          _logger.info("Created ER Run Calculation Result")

          applyRatesToLevyPayer(bundle, oEntity)
          if (erProgramme == ERProgramme_ACC.TC_STD) {
            new ERProcessUtils_ACC().applyRatesToLevyPayer(bundle, oEntity)
          }
        }, "sys")
      }
      if (oMostRecentERCalc != null) {
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          var oRunCalcResult = bundle.add(oMostRecentERCalc)
          oRunCalcResult.MostRecent = Boolean.FALSE
        }, "sys")
        oMostRecentERCalc.refresh()
      }
    }
  }

  function updateERRunCalcResultClaimData(runCalcResult : ERRunCalcResult_ACC, isFatalTotal : Integer, wcdTotal : BigDecimal,
                                          includeInFactorYr1 : Integer, includeInFactorYr2 : Integer, includeInFactorYr3 : Integer) {
    if (runCalcResult != null) {
      var curIsFatalTotal = Integer.valueOf(runCalcResult.IsFatalTotal) + isFatalTotal
      var curWCDTotal = sumDecimalArray({runCalcResult.WCDTotal, wcdTotal})
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var oRunCalcResult = bundle.add(runCalcResult)
        oRunCalcResult.IsFatalTotal = curIsFatalTotal
        oRunCalcResult.WCDTotal = curWCDTotal
        oRunCalcResult.IncludeInFactorYear1 = (includeInFactorYr1 > 0) ? Boolean.TRUE : Boolean.FALSE
        oRunCalcResult.IncludeInFactorYear2 = (includeInFactorYr2 > 0) ? Boolean.TRUE : Boolean.FALSE
        oRunCalcResult.IncludeInFactorYear3 = (includeInFactorYr3 > 0) ? Boolean.TRUE : Boolean.FALSE
      }, "sys")
      runCalcResult.refresh()
    }
  }

  function updateERRunCalcResultNCDFactor(runCalcResult : ERRunCalcResult_ACC, erMod : BigDecimal) {
    if (runCalcResult != null) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var oRunCalcResult = bundle.add(runCalcResult)
        oRunCalcResult.ERMod = erMod
      }, "sys")
      runCalcResult.refresh()
    }
  }

  function sumIntegerArray(numbers : Integer[]) : Integer {
    var validValues = numbers.where(\elt -> elt != null)
    if (validValues.HasElements) {
      return validValues.sum()
    }
    return 0
  }

  function sumDecimalArray(numbers : BigDecimal[]) : BigDecimal {
    var validValues = numbers.where(\elt -> elt != null)
    if (validValues.HasElements) {
      return validValues.sum()
    }
    return BigDecimal.ZERO
  }

  function getERRunCalcResult(erRun : ERRun_ACC,  erBusinessGroup : ERBusinessGroup_ACC, accPolicyID : String) : ERRunCalcResult_ACC {
    return Query.make(ERRunCalcResult_ACC)
        .compare(ERRunCalcResult_ACC#ERRun, Relop.Equals, erRun)
        .compare(ERRunCalcResult_ACC#ERBusinessGroup, Relop.Equals, erBusinessGroup)
        .compare(ERRunCalcResult_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        .select().getFirstResult()
  }

  function getERRunCalcResultMostRecent(runLevyYear : Integer, erBusinessGroup : ERBusinessGroup_ACC, accPolicyID : String) : ERRunCalcResult_ACC {
    return Query.make(ERRunCalcResult_ACC)
        .compare(ERRunCalcResult_ACC#ERBusinessGroup, Relop.Equals, erBusinessGroup)
        .compare(ERRunCalcResult_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        .compare(ERRunCalcResult_ACC#MostRecent, Relop.Equals, Boolean.TRUE)
        .compare(ERRunCalcResult_ACC#LevyYear_ACC, Relop.Equals, runLevyYear)
        .select().getFirstResult()
  }

  function getERCalculationTypeLevyYear(levyYear : Integer, erProgramme : ERProgramme_ACC) : ERCalculationType_ACC {
    return Query.make(ERCalcTypeLevyYear_ACC)
        .compare(ERCalcTypeLevyYear_ACC#LevyYear, Relop.Equals, levyYear)
        .compare(ERCalcTypeLevyYear_ACC#ERProgramme, Relop.Equals, erProgramme)
        .select().getFirstResult().ERCalculationType
  }

  function getAggregatedLEandLevy(policyGroup : ERRunPolicyGroup_ACC) : List<QueryRow> {
    var erRun  = policyGroup.ERRun
    var erBusinessGroup = policyGroup.ERBusinessGroup
    var accPolicyID = policyGroup.ACCPolicyID_ACC

    var sumLiableEarnings = QuerySelectColumns.dbFunctionWithAlias("SumLiableEarnings",
        DBFunction.Sum(Paths.make(ERRunPolicyDetail_ACC#LiableEarnings)))
    var sumLevyDue = QuerySelectColumns.dbFunctionWithAlias("SumLevyDue",
        DBFunction.Sum(Paths.make(ERRunPolicyDetail_ACC#LevyDue)))

    var queryPolicyDetail = Query.make(ERRunPolicyDetail_ACC)
        .compare(ERRunPolicyDetail_ACC#ERRun, Relop.Equals, erRun)
    var queryLevyPayer = queryPolicyDetail.join(ERRunPolicyDetail_ACC#ERRunLevyPayer)
    if (erBusinessGroup != null) {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ERBusinessGroup, Relop.Equals, erBusinessGroup)
      return queryPolicyDetail.select({
          QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunPolicyDetail_ACC#ERRun)),
          QuerySelectColumns.pathWithAlias("ERBusinessGroup", Paths.make(ERRunPolicyDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ERBusinessGroup)),
          QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunPolicyDetail_ACC#LevyYear)),
          sumLiableEarnings,
          sumLevyDue
      }).toList()

    } else if (accPolicyID != null) {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
      return queryPolicyDetail.select({
          QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunPolicyDetail_ACC#ERRun)),
          QuerySelectColumns.pathWithAlias("ACCPolicyID", Paths.make(ERRunPolicyDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ACCPolicyID_ACC)),
          QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunPolicyDetail_ACC#LevyYear)),
          sumLiableEarnings,
          sumLevyDue
      }).toList()
    }
    return null
  }

  function getLRGAggregatedLEandLevy(runCalcResult : ERRunCalcResult_ACC) : List<QueryRow> {
    var erRun  = runCalcResult.ERRun
    var erBusinessGroup = runCalcResult.ERBusinessGroup
    var accPolicyID = runCalcResult.ACCPolicyID_ACC
    var sumLiableEarnings = QuerySelectColumns.dbFunctionWithAlias("SumLiableEarnings",
        DBFunction.Sum(Paths.make(ERRunPolicyDetail_ACC#LiableEarnings)))
    var sumLevyDue = QuerySelectColumns.dbFunctionWithAlias("SumLevyDue",
        DBFunction.Sum(Paths.make(ERRunPolicyDetail_ACC#LevyDue)))

    var queryPolicyDetail = Query.make(ERRunPolicyDetail_ACC)
        .compare(ERRunPolicyDetail_ACC#ERRun, Relop.Equals, erRun)
    var queryLevyPayer = queryPolicyDetail.join(ERRunPolicyDetail_ACC#ERRunLevyPayer)
    if (erBusinessGroup != null) {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ERBusinessGroup, Relop.Equals, erBusinessGroup)
      return queryPolicyDetail.select({
          QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunPolicyDetail_ACC#ERRun)),
          QuerySelectColumns.pathWithAlias("ERBusinessGroup", Paths.make(ERRunPolicyDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ERBusinessGroup)),
          QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunPolicyDetail_ACC#LevyYear)),
          QuerySelectColumns.pathWithAlias("ERParamLRG", Paths.make(ERRunPolicyDetail_ACC#ERParamLRG)),
          sumLiableEarnings,
          sumLevyDue
      }).toList()

    } else if (accPolicyID != null) {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
      return queryPolicyDetail.select({
          QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunPolicyDetail_ACC#ERRun)),
          QuerySelectColumns.pathWithAlias("ACCPolicyID", Paths.make(ERRunPolicyDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ACCPolicyID_ACC)),
          QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunPolicyDetail_ACC#LevyYear)),
          QuerySelectColumns.pathWithAlias("ERParamLRG", Paths.make(ERRunPolicyDetail_ACC#ERParamLRG)),
          sumLiableEarnings,
          sumLevyDue
      }).toList()
    }
    return null
  }


  function getLRGAggregatedClaims(runCalcResult : ERRunCalcResult_ACC) : List<QueryRow> {
    var erRun  = runCalcResult.ERRun
    var erBusinessGroup = runCalcResult.ERBusinessGroup
    var accPolicyID = runCalcResult.ACCPolicyID_ACC
    var sumIsFatal = QuerySelectColumns.dbFunctionWithAlias("SumIsFatal",
        DBFunction.Sum(Paths.make(ERRunClaimDetail_ACC#IsFatal)))
    var sumMedicalSpend = QuerySelectColumns.dbFunctionWithAlias("SumMedicalSpend",
        DBFunction.Sum(Paths.make(ERRunClaimDetail_ACC#MedicalSpend)))
    var sumIsRiskMgmtQ = QuerySelectColumns.dbFunctionWithAlias("SumIsRiskMgmtQ",
        DBFunction.Sum(Paths.make(ERRunClaimDetail_ACC#IsRiskMgmtQualifying)))
    var sumExceedsMSTH = QuerySelectColumns.dbFunctionWithAlias("SumExceedsMSTH",
        DBFunction.Sum(Paths.make(ERRunClaimDetail_ACC#ExceedsMSTH)))
    var sumCappedWCD = QuerySelectColumns.dbFunctionWithAlias("SumCappedWCD",
        DBFunction.Sum(Paths.make(ERRunClaimDetail_ACC#CappedWCD)))
    var sumIncludeInFactor = QuerySelectColumns.dbFunctionWithAlias("SumIncludeInFactor",
        DBFunction.Sum(Paths.make(ERRunClaimDetail_ACC#IncludeInFactor)))

    var queryClaimDetail = Query.make(ERRunClaimDetail_ACC)
        .compare(ERRunClaimDetail_ACC#ERRun, Relop.Equals, erRun)
        .compare(ERRunClaimDetail_ACC#IsERQualifying, Relop.Equals, 1)
        .compare(ERRunClaimDetail_ACC#PercentLiable, Relop.GreaterThan, 0)
    queryClaimDetail.or(\orQry -> {
      orQry.compare(ERRunClaimDetail_ACC#IsRiskMgmtQualifying, Relop.Equals, 1)
      orQry.compare(ERRunClaimDetail_ACC#IsRehabMgmtQualifying, Relop.Equals, 1)
    })
    var queryLevyPayer = queryClaimDetail.join(ERRunClaimDetail_ACC#ERRunLevyPayer)
        .compare(ERRunLevyPayer_ACC#ERRunCalcResult, Relop.Equals, runCalcResult)
//    if (erBusinessGroup != null) {
//      queryLevyPayer.compare(ERRunLevyPayer_ACC#ERBusinessGroup, Relop.Equals, erBusinessGroup)
//      return queryClaimDetail.select({
//          QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunClaimDetail_ACC#ERRun)),
//          QuerySelectColumns.pathWithAlias("ERBusinessGroup", Paths.make(ERRunClaimDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ERBusinessGroup)),
//          QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunClaimDetail_ACC#ExperienceYear)),
//          QuerySelectColumns.pathWithAlias("ERParamLRG", Paths.make(ERRunClaimDetail_ACC#ERParamLRG)),
//          sumIsFatal,
//          sumMedicalSpend,
//          sumIsRiskMgmtQ,
//          sumExceedsMSTH,
//          sumCappedWCD,
//          sumIncludeInFactor
//      }).toList()
//
//    } else if (accPolicyID != null) {
//      queryLevyPayer.compare(ERRunLevyPayer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
//      return queryClaimDetail.select({
//          QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunClaimDetail_ACC#ERRun)),
//          QuerySelectColumns.pathWithAlias("ACCPolicyID", Paths.make(ERRunClaimDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ACCPolicyID_ACC)),
//          QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunClaimDetail_ACC#ExperienceYear)),
//          QuerySelectColumns.pathWithAlias("ERParamLRG", Paths.make(ERRunClaimDetail_ACC#ERParamLRG)),
//          sumIsFatal,
//          sumMedicalSpend,
//          sumIsRiskMgmtQ,
//          sumExceedsMSTH,
//          sumCappedWCD,
//          sumIncludeInFactor
//      }).toList()
//    }
//    return null
    return queryClaimDetail.select({
        QuerySelectColumns.pathWithAlias("ERRunCalcResult", Paths.make(ERRunClaimDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ERRunCalcResult)),
        QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunClaimDetail_ACC#ExperienceYear)),
        QuerySelectColumns.pathWithAlias("ERParamLRG", Paths.make(ERRunClaimDetail_ACC#ERParamLRG)),
        sumIsFatal,
        sumMedicalSpend,
        sumIsRiskMgmtQ,
        sumExceedsMSTH,
        sumCappedWCD,
        sumIncludeInFactor
    }).toList()
  }

  function getCUAggregatedLEandLevy(erRun : ERRun_ACC, erBusinessGroup : ERBusinessGroup_ACC,
                                    accPolicyID : String, experienceYear : Integer) : List<QueryRow> {
    var sumLiableEarnings = QuerySelectColumns.dbFunctionWithAlias("SumLiableEarnings",
        DBFunction.Sum(Paths.make(ERRunPolicyDetail_ACC#LiableEarnings)))
    var sumLevyDue = QuerySelectColumns.dbFunctionWithAlias("SumLevyDue",
        DBFunction.Sum(Paths.make(ERRunPolicyDetail_ACC#LevyDue)))

    var queryPolicyDetail = Query.make(ERRunPolicyDetail_ACC)
        .compare(ERRunPolicyDetail_ACC#ERRun, Relop.Equals, erRun)
    var queryLevyPayer = queryPolicyDetail.join(ERRunPolicyDetail_ACC#ERRunLevyPayer)
    if (accPolicyID != null) {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
      if (experienceYear != null) {
        queryPolicyDetail.compare(ERRunPolicyDetail_ACC#LevyYear, Relop.Equals, experienceYear)
        return queryPolicyDetail.select({
            QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunPolicyDetail_ACC#ERRun)),
            QuerySelectColumns.pathWithAlias("ACCPolicyID", Paths.make(ERRunPolicyDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ACCPolicyID_ACC)),
            QuerySelectColumns.pathWithAlias("ERParamCU", Paths.make(ERRunPolicyDetail_ACC#ERParamCU)),
            QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunPolicyDetail_ACC#LevyYear)),
            sumLiableEarnings,
            sumLevyDue
        }).orderByDescending(sumLevyDue).toList()
      } else {
        return queryPolicyDetail.select({
            QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunPolicyDetail_ACC#ERRun)),
            QuerySelectColumns.pathWithAlias("ACCPolicyID", Paths.make(ERRunPolicyDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ACCPolicyID_ACC)),
            QuerySelectColumns.pathWithAlias("ERParamCU", Paths.make(ERRunPolicyDetail_ACC#ERParamCU)),
            sumLiableEarnings,
            sumLevyDue
        }).orderByDescending(sumLevyDue).toList()
      }
    } else if (erBusinessGroup != null) {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ERBusinessGroup, Relop.Equals, erBusinessGroup)
      if (experienceYear != null) {
        queryPolicyDetail.compare(ERRunPolicyDetail_ACC#LevyYear, Relop.Equals, experienceYear)
        return queryPolicyDetail.select({
            QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunPolicyDetail_ACC#ERRun)),
            QuerySelectColumns.pathWithAlias("ERBusinessGroup", Paths.make(ERRunPolicyDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ERBusinessGroup)),
            QuerySelectColumns.pathWithAlias("ERParamCU", Paths.make(ERRunPolicyDetail_ACC#ERParamCU)),
            QuerySelectColumns.pathWithAlias("LevyYear", Paths.make(ERRunPolicyDetail_ACC#LevyYear)),
            sumLiableEarnings,
            sumLevyDue
        }).orderByDescending(sumLevyDue).toList()
      } else {
        return queryPolicyDetail.select({
            QuerySelectColumns.pathWithAlias("ERRun", Paths.make(ERRunPolicyDetail_ACC#ERRun)),
            QuerySelectColumns.pathWithAlias("ERBusinessGroup", Paths.make(ERRunPolicyDetail_ACC#ERRunLevyPayer, ERRunLevyPayer_ACC#ERBusinessGroup)),
            QuerySelectColumns.pathWithAlias("ERParamCU", Paths.make(ERRunPolicyDetail_ACC#ERParamCU)),
            sumLiableEarnings,
            sumLevyDue
        }).orderByDescending(sumLevyDue).toList()
      }
    }
    return null
  }

  function validateExpYearLEandLevy(experienceYear : Integer, sumLiableEarnings : MonetaryAmount, sumLevyDue : MonetaryAmount,
                                    malt : MonetaryAmount, validationCounter : ERRunValidationCounter) {
    if (experienceYear != null) {
      validationCounter.expWithLEorLevy++
      var cpFullTimeMinEarn = getCPFullTimeMinEarnings(experienceYear)
      if(cpFullTimeMinEarn == null) {
        validationCounter.yearMissingCPFullTimeMinEarn.add(experienceYear)
      } else {
        if (sumLiableEarnings > cpFullTimeMinEarn)
          validationCounter.validLE++
        if (sumLevyDue >= malt)
          validationCounter.validLevy++
      }
    }
  }

  function createERRunCalcLRGComp(runCalcResult : ERRunCalcResult_ACC, erParamLRG : ERParamLRG_ACC, lrgLEandLevy : ERRunExperienceLEandLevy) {
    var lrgLETotal = sumDecimalArray({lrgLEandLevy.liableEarningsYr1, lrgLEandLevy.liableEarningsYr2, lrgLEandLevy.liableEarningsYr3})
    var lrgLevyTotal = sumDecimalArray({lrgLEandLevy.levyDueYr1, lrgLEandLevy.levyDueYr2, lrgLEandLevy.levyDueYr3})

    var oEntity : ERRunCalcLRGComp_ACC
    oEntity = getERRunCalcLRGComp(runCalcResult, erParamLRG)
    if (oEntity == null) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        oEntity = new ERRunCalcLRGComp_ACC()
        oEntity.ERRunCalcResult = runCalcResult
        oEntity.ERParamLRG = erParamLRG
        oEntity.LRGLiableEarningTotal = new MonetaryAmount(lrgLETotal, Currency.TC_NZD)
        oEntity.LRGLiableEarningTotalYear1 = new MonetaryAmount(lrgLEandLevy.liableEarningsYr1, Currency.TC_NZD)
        oEntity.LRGLiableEarningTotalYear2 = new MonetaryAmount(lrgLEandLevy.liableEarningsYr2, Currency.TC_NZD)
        oEntity.LRGLiableEarningTotalYear3 = new MonetaryAmount(lrgLEandLevy.liableEarningsYr3, Currency.TC_NZD)
        oEntity.LRGLevyDueTotal = new MonetaryAmount(lrgLevyTotal, Currency.TC_NZD)
        oEntity.LRGLevyDueTotalYear1 = new MonetaryAmount(lrgLEandLevy.levyDueYr1, Currency.TC_NZD)
        oEntity.LRGLevyDueTotalYear2 = new MonetaryAmount(lrgLEandLevy.levyDueYr2, Currency.TC_NZD)
        oEntity.LRGLevyDueTotalYear3 = new MonetaryAmount(lrgLEandLevy.levyDueYr3, Currency.TC_NZD)
        oEntity.LRGWCDTotal = BigDecimal.ZERO
        oEntity.LRGWCDTotalYear1 = BigDecimal.ZERO
        oEntity.LRGWCDTotalYear2 = BigDecimal.ZERO
        oEntity.LRGWCDTotalYear3 = BigDecimal.ZERO
        oEntity.BeforeAdj_LRGWCDTotalYear1 = BigDecimal.ZERO
        oEntity.BeforeAdj_LRGWCDTotalYear2 = BigDecimal.ZERO
        oEntity.BeforeAdj_LRGWCDTotalYear3 = BigDecimal.ZERO
        oEntity.LRGRiskMgmtClaimsTotal = BigDecimal.ZERO
        oEntity.LRGRiskMgmtClaimsTotalYear1 = BigDecimal.ZERO
        oEntity.LRGRiskMgmtClaimsTotalYear2 = BigDecimal.ZERO
        oEntity.LRGRiskMgmtClaimsTotalYear3 = BigDecimal.ZERO
        _logger.info("Created ER Run Calculation LRG Component")
      }, "sys")
    }
  }

  function getERRunCalcLRGComp(runCalcResult : ERRunCalcResult_ACC, erParamLRG : ERParamLRG_ACC) : ERRunCalcLRGComp_ACC {
    return Query.make(ERRunCalcLRGComp_ACC)
        .compare(ERRunCalcLRGComp_ACC#ERRunCalcResult, Relop.Equals, runCalcResult)
        .compare(ERRunCalcLRGComp_ACC#ERParamLRG, Relop.Equals, erParamLRG)
        .select().getFirstResult()
  }

  function getERRunCalcLRGComp(runCalcResult: ERRunCalcResult_ACC) : ERRunCalcLRGComp_ACC[] {
    return Query.make(ERRunCalcLRGComp_ACC)
        .compare(ERRunCalcLRGComp_ACC#ERRunCalcResult, Relop.Equals, runCalcResult)
        .select().toTypedArray()
  }

  function updateERRunCalcLRGComp(runCalcResult : ERRunCalcResult_ACC, erParamLRG : ERParamLRG_ACC, expClaims : ERRunExperienceClaims) {
    var lrgRiskMgmtClaimsTotal = sumDecimalArray({expClaims.riskMgmtClaimsTotalYr1, expClaims.riskMgmtClaimsTotalYr2, expClaims.riskMgmtClaimsTotalYr3})
    var lrgWCDTotal = sumDecimalArray({expClaims.wcdTotalYr1, expClaims.wcdTotalYr2, expClaims.wcdTotalYr3})

    var runLRGComp : ERRunCalcLRGComp_ACC
    runLRGComp = getERRunCalcLRGComp(runCalcResult, erParamLRG)
    if (runLRGComp != null) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        var oRunLRGComp = bundle.add(runLRGComp)
        if (expClaims.expYearYr1 != null) {
          oRunLRGComp.LRGRiskMgmtClaimsTotalYear1 = expClaims.riskMgmtClaimsTotalYr1
          oRunLRGComp.LRGWCDTotalYear1 = expClaims.wcdTotalYr1
        }
        if (expClaims.expYearYr2 != null) {
          oRunLRGComp.LRGRiskMgmtClaimsTotalYear2 = expClaims.riskMgmtClaimsTotalYr2
          oRunLRGComp.LRGWCDTotalYear2 = expClaims.wcdTotalYr2
        }
        if (expClaims.expYearYr3 != null) {
          oRunLRGComp.LRGRiskMgmtClaimsTotalYear3 = expClaims.riskMgmtClaimsTotalYr3
          oRunLRGComp.LRGWCDTotalYear3 = expClaims.wcdTotalYr3
        }
        oRunLRGComp.LRGRiskMgmtClaimsTotal = lrgRiskMgmtClaimsTotal
        oRunLRGComp.LRGWCDTotal = lrgWCDTotal
      }, "sys")
      runLRGComp.refresh()
    }
  }

  function createERRunClaimDetail(claim : ERRunClaimValues) {
    var levyPayer = claim.erRunLevyPayer
    var oLRGCode = getMappedERParamLRG(claim.derivedERParamCU)
    var oEntity : ERRunClaimDetail_ACC

    oEntity = getERRunClaimDetail(levyPayer.ERRun, levyPayer, claim.claimNumber,
        claim.percentLiable, claim.experienceYear, claim.claimERParamCU, claim.claimDesc)
    if (claim.claimDesc == "AEP Claim" and oEntity != null) {
      _logger.info("ER Run Claim Detail already exist for AEP Claim with LiableEmployer:${levyPayer.ACCPolicyID_ACC} and ClaimNumber:${claim.claimNumber}")
    } else {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        if (oEntity == null) {
          oEntity = new ERRunClaimDetail_ACC()
          oEntity.ERRun = levyPayer.ERRun
          oEntity.OriginalERRunLevyPayer = claim.originalERRunLevyPayer
          oEntity.ERRunLevyPayer = claim.erRunLevyPayer
          oEntity.ClaimNumber = claim.claimNumber
          oEntity.PercentLiable = claim.percentLiable
          oEntity.ExperienceYear = claim.experienceYear
          oEntity.ClaimERParamCU = claim.claimERParamCU
        } else {
          oEntity = bundle.add(oEntity)
        }
        oEntity.DerivedERParamCU = claim.derivedERParamCU
        oEntity.DerivedCUReason = claim.derivedCUReason
        oEntity.ERParamLRG = oLRGCode
        oEntity.ClaimantACCNumber = claim.claimantACCNumber
        oEntity.ClaimantName = claim.claimantName
        oEntity.InjuryDate = claim.injuryDate
        oEntity.ClaimFundCode = claim.claimFundCode
        oEntity.ClaimFundDesc = claim.claimFundDesc
        oEntity.ERParamFundCode = claim.erParamFundCode
        oEntity.AcceptedDate = claim.acceptedDate
        oEntity.ClaimDesc = claim.claimDesc
        oEntity.AccidentLocation = claim.accidentLocation
        oEntity.CoverDecision = claim.coverDecision
        oEntity.IsSensitive = claim.isSensitive
        oEntity.IsFatal = claim.isFatal
        oEntity.IsGradualProcess = claim.isGradualProcess
        oEntity.IsAdverse = claim.isAdverse
        oEntity.ExperienceYear = claim.experienceYear
        oEntity.GreatestModifiedDate = claim.greatestModifiedDate
        oEntity.CntExpInjury = claim.cntExpInjury
        oEntity.PrimaryCodingSystem = claim.primaryCodingSystem
        oEntity.PrimaryInjuryCode = claim.primaryInjuryCode
        oEntity.PrimaryInjuryDesc = claim.primaryInjuryDesc
        oEntity.PercentLiable = claim.percentLiable
        oEntity.UncappedWCD = claim.uncappedWCD
        oEntity.CappedWCD = claim.cappedWCD
        oEntity.MedicalSpend = claim.medicalSpend
        oEntity.ExceedsMSTH = claim.exceedsMSTH
        oEntity.IsRiskMgmtQualifying = claim.isRiskMgmtQualifying
        oEntity.IsRehabMgmtQualifying = claim.isRehabMgmtQualifying
        oEntity.IsERGradual = claim.isERGradual
        oEntity.IsNCDQualifying = claim.isNCDQualifying
        oEntity.IsERQualifying = claim.isERQualifying
        oEntity.NonQualifyingReason = claim.nonQualifyingReason
        oEntity.IncludeInFactor = claim.includeInFactor
        _logger.info("Created ER Run Claim Detail")
      }, "sys")
    }
  }

  function getERRunClaimDetail(erRun : ERRun_ACC, levyPayer : ERRunLevyPayer_ACC, claimNumber : String,
                               percentLiable : BigDecimal, experienceYear : Integer,
                               claimERParamCU : ERParamCU_ACC, claimDesc : String) : ERRunClaimDetail_ACC {
    var queryClaimDetail = Query.make(ERRunClaimDetail_ACC)
        .compare(ERRunClaimDetail_ACC#ERRun, Relop.Equals, erRun)
        .compare(ERRunClaimDetail_ACC#ClaimNumber, Relop.Equals, claimNumber)
        .compare(ERRunClaimDetail_ACC#ERRunLevyPayer, Relop.Equals, levyPayer)
    if (claimDesc != "AEP Claim") {
      queryClaimDetail.compare(ERRunClaimDetail_ACC#PercentLiable, Relop.Equals, percentLiable)
          .compare(ERRunClaimDetail_ACC#ExperienceYear, Relop.Equals, experienceYear)
          .compare(ERRunClaimDetail_ACC#ClaimERParamCU, Relop.Equals, claimERParamCU)
    }
    return queryClaimDetail.select().FirstResult
  }

  function getERRequestParamValue(paramCode : ERParametersCode_ACC, levyYear : Integer) : ERParamValue_ACC {
    return Query.make(ERParamValue_ACC)
        .compare(ERParamValue_ACC#LevyApplicationYear, Relop.Equals, levyYear)
        .compare(ERParamValue_ACC#ERParameterCode, Relop.Equals, paramCode)
        .select().FirstResult
  }

  function getERLRGParametersValue_ACC(erParamLRG : ERParamLRG_ACC, experienceYear : Integer) : ERLRGParametersValue_ACC {
    return Query.make(ERLRGParametersValue_ACC)
        .compare(ERLRGParametersValue_ACC#ERParamLRG, Relop.Equals, erParamLRG)
        .compare(ERLRGParametersValue_ACC#ExperienceYear, Relop.Equals, experienceYear)
        .select().FirstResult
  }

  function getERCredibilityWeightingBand(runLevyYear : Integer, liableEarnings : BigDecimal) : ERParamCredibleWeight_ACC {
    return Query.make(ERParamCredibleWeight_ACC)
        .compare(ERParamCredibleWeight_ACC#LevyApplicationYear, Relop.Equals, runLevyYear)
        .compare(ERParamCredibleWeight_ACC#MinLiableEarnings_amt, Relop.LessThan, liableEarnings)
        .compare(ERParamCredibleWeight_ACC#MaxLiableEarnings_amt, Relop.GreaterThanOrEquals, liableEarnings)
        .select().FirstResult
  }

  function getMaxERCredibilityWeightingBand(runLevyYear : Integer) : ERParamCredibleWeight_ACC {
    var minLE = QuerySelectColumns.path(Paths.make(ERParamCredibleWeight_ACC#MinLiableEarnings_amt))
    return Query.make(ERParamCredibleWeight_ACC)
        .compare(ERParamCredibleWeight_ACC#LevyApplicationYear, Relop.Equals, runLevyYear)
        .select().orderByDescending(minLE).FirstResult
  }

  function getERParamClaimsWeight(runLevyYear : Integer, expYear : Integer) : ERParamClaimsWeight_ACC {
    return Query.make(ERParamClaimsWeight_ACC)
        .compare(ERParamClaimsWeight_ACC#LevyApplicationYear, Relop.Equals, runLevyYear)
        .compare(ERParamClaimsWeight_ACC#ExperienceYear, Relop.Equals, expYear)
        .select().FirstResult
  }

  function getERParamDiscLoadSteps(runLevyYear : Integer, eMod : BigDecimal) : ERParamDiscLoadSteps_ACC {
    return Query.make(ERParamDiscLoadSteps_ACC)
        .compare(ERParamDiscLoadSteps_ACC#LevyApplicationYear, Relop.Equals, runLevyYear)
        .compare(ERParamDiscLoadSteps_ACC#BandMin, Relop.LessThan, eMod.divide(0.01).intValue())
        .compare(ERParamDiscLoadSteps_ACC#BandMax, Relop.GreaterThanOrEquals, eMod.divide(0.01).intValue())
        .select().FirstResult
  }

  function getMinERParamDiscLoadSteps(runlevyYear : Integer) : ERParamDiscLoadSteps_ACC {
    var colStep = QuerySelectColumns.path(Paths.make(ERParamDiscLoadSteps_ACC#Step))
    return Query.make(ERParamDiscLoadSteps_ACC)
        .compare(ERParamDiscLoadSteps_ACC#LevyApplicationYear, Relop.Equals, runlevyYear)
        .select().orderBy(colStep).FirstResult
  }

  function getMaxERParamDiscLoadSteps(runlevyYear : Integer) : ERParamDiscLoadSteps_ACC {
    var colStep = QuerySelectColumns.path(Paths.make(ERParamDiscLoadSteps_ACC#Step))
    return Query.make(ERParamDiscLoadSteps_ACC)
        .compare(ERParamDiscLoadSteps_ACC#LevyApplicationYear, Relop.Equals, runlevyYear)
        .select().orderByDescending(colStep).FirstResult
  }

  function getERParamStepAdj(runlevyYear : Integer) : ERParamStepAdj_ACC {
    return Query.make(ERParamStepAdj_ACC)
        .compare(ERParamStepAdj_ACC#LevyApplicationYear, Relop.Equals, runlevyYear)
        .select().FirstResult
  }

  function getAdjustedERParamDiscLoadStep(runlevyYear : Integer, erMod : BigDecimal, stepAdj : Integer, cappedAdj : Boolean) : ERParamDiscLoadSteps_ACC {
    var colStep = QuerySelectColumns.path(Paths.make(ERParamDiscLoadSteps_ACC#Step))
    var queryDiscLoadStep = Query.make(ERParamDiscLoadSteps_ACC)
        .compare(ERParamDiscLoadSteps_ACC#LevyApplicationYear, Relop.Equals, runlevyYear)
        .select().orderBy(colStep).toList()
    _logger.info("getAdjustedERParamDiscLoadStep ${queryDiscLoadStep.Count} stepAdj ${stepAdj} ")
    cappedAdj = Boolean.FALSE
    // iterate through available steps until a step matches the ERMod value
    for (dlStep in queryDiscLoadStep index i) {
      if (new BigDecimal(dlStep.getStep()).multiply(0.01) == erMod) {
        // cap the adjustment to maximum avalable step
        if ((i + stepAdj) > queryDiscLoadStep.size() - 1) {
          cappedAdj = Boolean.TRUE
          return queryDiscLoadStep.get(queryDiscLoadStep.size() - 1)
        } else {
          return queryDiscLoadStep.get(i + stepAdj)
        }
      }
    }
    return null
  }

  function getERParamClaimsExcluded(runLevyYear : Integer) : ERParamClaimsExcluded_ACC[] {
    return Query.make(ERParamClaimsExcluded_ACC)
        .compare(ERParamClaimsExcluded_ACC#LevyApplicationYear, Relop.Equals, runLevyYear)
        .select().toTypedArray()
  }

  function applyCeilingAndFlooring(value: BigDecimal, ceiling: BigDecimal, floor: BigDecimal): BigDecimal {
    if (value < floor)
      return floor
    if (value > ceiling)
      return ceiling
    return value
  }

  function getShareholderCPXLiableEarnings(cpxPeriod : PolicyPeriod) : BigDecimal {
    var cpxPeriodStart = cpxPeriod.INDCPXLine.INDCPXCovs*.CPXInfoCovs*.PeriodStart
    var querySheCpxQuery = Query.make(entity.PolicySHECPXDetails_ACC)
        .compare(PolicySHECPXDetails_ACC#policyNumber, Relop.Equals, cpxPeriod.ACCPolicyID_ACC)
        .compare(PolicySHECPXDetails_ACC#ExpirationDate, Relop.Equals, null)
        .compareIn(PolicySHECPXDetails_ACC#cpxStartDate, cpxPeriodStart)
        .compare(PolicySHECPXDetails_ACC#shareAdjLE_amt,Relop.NotEquals,null)
        .compare(PolicySHECPXDetails_ACC#shareAuditAdjLE_amt, Relop.NotEquals, null)
    querySheCpxQuery.join("Branch",PolicyTerm,"LatestBranchID_ACC")

    var results = querySheCpxQuery.select()
    var total : BigDecimal
    if(results.HasElements) {
      total = BigDecimal.ZERO
      var auditResults = results.where(\elt -> elt.Branch.Job.Subtype == Job.TC_AUDIT and elt.shareAuditAdjLE_amt > BigDecimal.ZERO)
      if(auditResults.HasElements) {
        total = total.add(auditResults*.shareAuditAdjLE_amt.sum())
      }

      var nonAuditResults = results.where(\elt -> elt.Branch.Job.Subtype != Job.TC_AUDIT and elt.shareAdjLE_amt > BigDecimal.ZERO)
      if(nonAuditResults.HasElements) {
        total = total.add(nonAuditResults*.shareAdjLE_amt.sum())
      }
    }
    return total
  }

  function applyRatesToLevyPayer(bundle : Bundle, runCalcResult : ERRunCalcResult_ACC) {
    var queryLevyPayer = Query.make(ERRunLevyPayer_ACC)
        .compare(ERRunLevyPayer_ACC#ERRun, Relop.Equals, runCalcResult.ERRun)
    if (runCalcResult.ERBusinessGroup != null) {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ERBusinessGroup, Relop.Equals, runCalcResult.ERBusinessGroup)
    } else {
      queryLevyPayer.compare(ERRunLevyPayer_ACC#ACCPolicyID_ACC, Relop.Equals, runCalcResult.ACCPolicyID_ACC)
    }
    var results = queryLevyPayer.select()
    if (results.HasElements) {
      for (levyPayer in results.iterator()) {
        var oEntity = bundle.add(levyPayer)
        oEntity.ERRunCalcResult = runCalcResult
        oEntity.ERProgramme = runCalcResult.ERProgramme
        _logger.info("applyRatesToLevyPayer levyPayer ${oEntity.ACCPolicyID_ACC} erProgramme ${oEntity.ERRunCalcResult.ERProgramme.Name} erMode ${oEntity.ERRunCalcResult.ERMod} ")
      }
    } else {
      if (runCalcResult.ERBusinessGroup != null) {
        _logger.info("applyRatesToLevyPayer BuisnessGroupID: ${runCalcResult.ERBusinessGroup.BusinessGroupID} does not have any Run Levy Payers")
      } else {
        _logger.info("applyRatesToLevyPayer ACCPolicyID: ${runCalcResult.ACCPolicyID_ACC} does not have any Run Levy Payers")
      }
    }
  }

  function getPolicyTermByACCPolicyIDAndLevyYear(accPolicyID : String, levyYear : Integer) : IQueryBeanResult<PolicyTerm> {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        .compare(PolicyTerm#LatestBranchID_ACC, Relop.NotEquals, null)
        .compare(PolicyTerm#Cancelled_ACC, Relop.Equals, false)
        .compare(PolicyTerm#LevyYear_ACC, Relop.Equals, levyYear).select()
  }

  function getLatestPolicyTermByACCPolicyID(accPolicyID : String) : PolicyTerm {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        .compare(PolicyTerm#LatestBranchID_ACC, Relop.NotEquals, null)
        .compare(PolicyTerm#Cancelled_ACC, Relop.Equals, false)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(entity.PolicyTerm#LevyYear_ACC))).first()
  }

  function checkIfACCPolicyIDExists(accPolicyID : String) : Boolean {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        .select().HasElements
  }

  function getContactByACCPolicyIDAndLevyYear(accPolicyID : String, levyYear : int) : Set<Contact> {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        .compare(PolicyTerm#LatestBranchID_ACC, Relop.NotEquals, null)
        .compare(PolicyTerm#Cancelled_ACC, Relop.Equals, false)
        .select().map(\elt -> elt.Policy).map(\elt -> elt.Account).map(\elt -> elt.AccountHolderContact).toSet()
  }

  function getPolicyTermByLevyPayerNameLevyYear(levyPayerName : String, levyYear : int) : IQueryBeanResult<PolicyTerm> {
    var policyTermQuery = Query.make(PolicyTerm)
        policyTermQuery.compare(PolicyTerm#LatestBranchID_ACC, Relop.NotEquals, null)
        policyTermQuery.compare(PolicyTerm#Cancelled_ACC, Relop.NotEquals, false)
        policyTermQuery.compare(PolicyTerm#LevyYear_ACC, Relop.Equals, levyYear)
    var policyQuery = policyTermQuery.join(PolicyTerm#Policy)
    var accountQuery = policyQuery.join(Policy#Account)
    var contact = accountQuery.join(Account#AccountHolderContact)
    contact.compare(Contact#DisplayName, Relop.Equals, levyPayerName)
    return policyTermQuery.select()
  }

  function getPeriodLevyCost(period : PolicyPeriod, chargePattern : ChargePattern, cuCode : String) : BigDecimal {
    var cuLevyCost = BigDecimal.ZERO
    var allWALCosts = period.AllCosts.where(\elt ->
        elt.ChargePattern == chargePattern
            and elt.isCULinkedWAL()
            and elt.CUCode == cuCode
    )
    if (allWALCosts.HasElements) {
      if(period.INDCoPLineExists) {
        cuLevyCost = allWALCosts*.StandardAmount_amt.sum()
      } else {
        cuLevyCost = allWALCosts*.StandardTermAmount_amt.sum()
      }
    }
    return cuLevyCost
  }

  function getWALCost(period : PolicyPeriod, chargePattern : ChargePattern, cuCode : String) : Cost {
    var cuLevyCost = BigDecimal.ZERO
    if (period.INDCoPLineExists) {
      return period.INDCoPLine.INDCosts.firstWhere(\elt ->
          elt.ChargePattern == chargePattern
              and elt.isCULinkedWAL()
              and elt.CUCode == cuCode)
    } else if (period.EMPWPCLineExists) {
      return period.EMPWPCLine.EMPCosts.firstWhere(\elt ->
          elt.ChargePattern == chargePattern
              and elt.isCULinkedWAL()
              and elt.CUCode == cuCode)
    } else if (period.CWPSLineExists) {
      return period.CWPSLine.CWPSCovs.first().CWPSCosts.firstWhere(\elt ->
          elt.ChargePattern == chargePattern
              and elt.isCULinkedWAL()
              and elt.CUCode == cuCode)
    }
    return null
  }

  function getBICCode(period : PolicyPeriod, cuCode : String) : PolicyLineBusinessClassificationUnit_ACC {
    var cuLevyCost = BigDecimal.ZERO
    if (period.INDCoPLineExists) {
      return period.INDCoPLine.BICCodes.firstWhere(\elt ->
          elt.CUCode == cuCode)
    } else if (period.EMPWPCLineExists) {
      return period.EMPWPCLine.BICCodes.firstWhere(\elt ->
          elt.CUCode == cuCode)
    } else if (period.CWPSLineExists) {
      return period.CWPSLine.BICCodes.firstWhere(\elt ->
          elt.CUCode == cuCode)
    }
    return null
  }

  function encrypt(value : String) : String {
    var _erEncryptionSalt = ConfigurationProperty.ER_ENCRYPTION_SALT.PropertyValue
    try {
      // Convert the value to bytes using UTF-8 encoding
      var valueBytes = value.getBytes(StandardCharsets.UTF_8)
      var saltBytes = _erEncryptionSalt.getBytes(StandardCharsets.UTF_8)
      // Combine salt and value binary
      if (valueBytes == null || saltBytes == null || valueBytes.length == 0 || saltBytes.length == 0) {
        throw new IllegalArgumentException("Salt and/or Value cannot be null or blank");
      }
      var shortIdx = saltBytes.length
      var longIdx = valueBytes.length
      if (shortIdx > longIdx) {
        longIdx = saltBytes.length
        shortIdx = valueBytes.length
      }
      var combinedBytes : byte[] = new byte[shortIdx + longIdx]
      for (i in 0..|shortIdx) {
        combinedBytes[(i*2)]  = saltBytes[i]
        combinedBytes[((i*2)+1)] = valueBytes[i]
      }
      for (j in shortIdx..|longIdx) {
        if (longIdx == valueBytes.length) {
          combinedBytes[j + shortIdx] = valueBytes[j]
        } else {
          combinedBytes[j + shortIdx] = saltBytes[j]
        }
      }
      var strSaltLen = "0000".concat(String.valueOf(saltBytes.length))
      var lenBytes = strSaltLen.substring(Math.max(strSaltLen.length()-4, 0)).getBytes(StandardCharsets.UTF_8)
      var combinedIdx = combinedBytes.length
      var midIdx = combinedIdx / 2
      if (combinedIdx % 2 != 0)
        midIdx = (combinedIdx + 1) / 2
      var lenIdx = lenBytes.length
      var targetBytes : byte[] = new byte[combinedIdx + lenIdx]
      for (x in 0..|midIdx) {
        targetBytes[x] = combinedBytes[x]
      }
      var yIdx = midIdx + lenIdx
      for (y in midIdx..|yIdx) {
        targetBytes[y] = lenBytes[y - midIdx]
      }
      var zIdx = combinedIdx + lenIdx
      for (z in yIdx..|zIdx) {
        targetBytes[z] = combinedBytes[z - lenIdx]
      }
      // Encode the value to Base64
      var encodedBytes = Base64.getEncoder().encode(targetBytes)
      // Convert the encoded bytes to a string
      return new String(encodedBytes, StandardCharsets.UTF_8)
    } catch (e : Exception) {
      // Handle any exceptions that may occur
      throw new RuntimeException("Error encoding value to Base64: " + e.Message, e)
    }
  }

  function decrypt(encstr : String) : String {
    var _erEncryptionSalt = ConfigurationProperty.ER_ENCRYPTION_SALT.PropertyValue
    try {
      // Decode the value from Base64
      var targetBytes = Base64.getDecoder().decode(encstr)
      var targetIdx = targetBytes.length
      var midIdx = targetIdx / 2
      if (targetIdx % 2 != 0)
        midIdx = (targetIdx + 1) / 2
      midIdx -= 2
      var lenBytes : byte[] = new byte[4]
      var combinedBytes : byte[] = new byte[targetIdx - 4]
      for (x in 0..|targetIdx) {
        if (x < midIdx) {
          combinedBytes[x] = targetBytes[x]
        } else if (x >= midIdx && x <= (midIdx + 3)) {
          lenBytes[x - midIdx] = targetBytes[x]
        } else {
          combinedBytes[x - 4] = targetBytes[x]
        }
      }

      var saltBytes = _erEncryptionSalt.getBytes(StandardCharsets.UTF_8)
      var shortIdx = saltBytes.length
      var longIdx = combinedBytes.length - shortIdx
      if (shortIdx > longIdx) {
        longIdx = saltBytes.length
        shortIdx = combinedBytes.length - shortIdx
      }
      var decodedSaltBytes : byte[] = new byte[saltBytes.length]
      var decodedValueBytes : byte[] = new byte[combinedBytes.length - saltBytes.length]
      for (i in 0..|shortIdx) {
        decodedSaltBytes[i] = combinedBytes[(i*2)]
        decodedValueBytes[i] = combinedBytes[(i*2)+1]
      }
      for (j in shortIdx..|longIdx) {
        if (longIdx == saltBytes.length) {
          decodedSaltBytes[j] = combinedBytes[j + shortIdx]
        } else {
          decodedValueBytes[j] = combinedBytes[j + shortIdx]
        }
      }
      var decodedSalt = new String(decodedSaltBytes, StandardCharsets.UTF_8)
      if (_erEncryptionSalt == decodedSalt) {
        return new String(decodedValueBytes, StandardCharsets.UTF_8)
      } else {
        throw new RuntimeException("Encoded value does not match the original value.")
      }
    } catch (e : Exception) {
      throw new RuntimeException("Error decoding Base64 value: " + e.Message, e)
    }
  }

  function encodeToBase64(value: String): String {
    try {
      // Convert the value to bytes using UTF-8 encoding
      var valueBytes = value.getBytes(StandardCharsets.UTF_8)
      // Encode the value to Base64
      var encodedBytes = Base64.getEncoder().encode(valueBytes)
      // Convert the encoded bytes to a string
      return new String(encodedBytes, StandardCharsets.UTF_8)
    } catch (e : Exception) {
      // Handle any exceptions that may occur
      throw new RuntimeException("Error encoding value to Base64: " + e.Message, e)
    }
  }

  function updateEncryption(encstr : String) : String {
    var digitBytes = "0123456789".getBytes(StandardCharsets.UTF_8)
    var _erEncryptionSalt = ConfigurationProperty.ER_ENCRYPTION_SALT.PropertyValue
    var expectedSaltBytes = _erEncryptionSalt.getBytes(StandardCharsets.UTF_8)
    try {
      // Decode the value from Base64
      var targetBytes = Base64.getDecoder().decode(encstr)
      var targetIdx = targetBytes.length
      var midIdx = targetIdx / 2
      if (targetIdx % 2 != 0)
        midIdx = (targetIdx + 1) / 2
      midIdx -= 2
      var lenBytes : byte[] = new byte[4]
      var tempBytes : byte[] = new byte[targetIdx - 4]
      for (x in 0..|targetIdx) {
        if (x < midIdx) {
          tempBytes[x] = targetBytes[x]
        } else if (x >= midIdx && x <= (midIdx + 3)) {
          lenBytes[x - midIdx] = targetBytes[x]
        } else {
          tempBytes[x - 4] = targetBytes[x]
        }
      }
      // check if encryted data contains valid salt length
      var validLen = Boolean.TRUE
      for (lenByte in lenBytes) {
        // Loop through the array to check if the byte is present
        var byteFound = Boolean.FALSE
        for (digitByte in digitBytes) {
          if (digitByte == lenByte) {
            byteFound = Boolean.TRUE
            break // Exit the loop as soon as the byte is found
          }
        }
        if (byteFound == Boolean.FALSE) {
          validLen = Boolean.FALSE
          break
        }
      }
      var saltIdx : Integer
      var saltBytes : byte[]
      var combinedBytes : byte[]
      if (validLen == Boolean.FALSE) {
        combinedBytes = targetBytes
        saltIdx = saltBytes.length
      } else {
        combinedBytes = tempBytes
        saltIdx = Integer.valueOf(new String(lenBytes, StandardCharsets.UTF_8))
      }
      var combinedIdx = combinedBytes.length
      var shortIdx = saltIdx
      var longIdx = combinedIdx - shortIdx
      if (shortIdx > longIdx) {
        longIdx = saltIdx
        shortIdx = combinedIdx - shortIdx
      }
      var decodedSaltBytes : byte[] = new byte[saltIdx]
      var decodedValueBytes : byte[] = new byte[combinedIdx - saltIdx]
      for (i in 0..|shortIdx) {
        decodedSaltBytes[i] = combinedBytes[(i*2)]
        decodedValueBytes[i] = combinedBytes[(i*2)+1]
      }
      for (j in shortIdx..|longIdx) {
        if (longIdx == saltIdx) {
          decodedSaltBytes[j] = combinedBytes[j + shortIdx]
        } else {
          decodedValueBytes[j] = combinedBytes[j + shortIdx]
        }
      }
      var decodedSalt = new String(decodedSaltBytes, StandardCharsets.UTF_8)
      if (_erEncryptionSalt == decodedSalt) {
        return null
      } else {
        var decodedValue = new String(decodedValueBytes, StandardCharsets.UTF_8)
        return encrypt(decodedValue)
      }
    } catch (e : Exception) {
      throw new RuntimeException("Error decoding Base64 value: " + e.Message, e)
    }
  }

  function getACCPolicyIDName(accPolicyID : String) : String {
    var accid = accPolicyID.substring(0, accPolicyID.length() - 1)
    return Query.make(entity.Contact)
        .compare(Contact#ACCID_ACC, Relop.Equals, accid)
        .select().FirstResult.DisplayName
  }

  function getACCPolicyIDName(accPolicyID : String, encrypted : Boolean) : String {
    var levyPayerName = getACCPolicyIDName(accPolicyID)
    if (encrypted) {
      return encrypt(levyPayerName)
    }
    return levyPayerName
  }

  function getWorkAccountLevyRateByCUCode(cuCode : String, startDate : Date, endDate : Date) : BigDecimal {
    _logger.info("getWorkAccountLevyRateByCUCode cuCode ${cuCode} startDate ${startDate} endDate ${endDate}")
    var walQuery = Query.make(WorkAccountLevyRate_ACC)
    walQuery.and(\andQuery -> {
      andQuery.compare(WorkAccountLevyRate_ACC#StartDate, Relop.LessThanOrEquals, startDate.trimToMidnight())
      andQuery.compare(WorkAccountLevyRate_ACC#EndDate, Relop.GreaterThanOrEquals, endDate.trimToMidnight())
    })
    walQuery.compare(WorkAccountLevyRate_ACC#ClassificationUnitCode, Relop.Equals, cuCode)
    var rateBookQuery = walQuery.join(WorkAccountLevyRate_ACC#RateTable).join(RateTable#RateBook)
    rateBookQuery.compare(RateBook#Status, Relop.Equals, RateBookStatus.TC_ACTIVE)
    var result = walQuery.select().orderByDescending(QuerySelectColumns.path(Paths.make(WorkAccountLevyRate_ACC#CreateTime))).FirstResult
    return result.Rate ?: BigDecimal.ZERO
  }
}