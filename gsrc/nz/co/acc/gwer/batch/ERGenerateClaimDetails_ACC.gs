package nz.co.acc.gwer.batch

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QueryRow
uses gw.api.database.Relop
uses gw.api.database.QuerySelectColumns
uses gw.api.database.DBFunction
uses gw.api.database.Restriction
uses gw.api.database.InOperation

uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.ERRunClaimValues
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses nz.co.acc.gwer.ERRunParameter

uses java.math.BigDecimal
uses java.math.RoundingMode

class ERGenerateClaimDetails_ACC extends WorkQueueBase<ERRunLevyPayer_ACC, StandardWorkItem> {
  private static var _logger = StructuredLogger_ACC.CONFIG.withClass(ERGenerateClaimDetails_ACC)
  private var _erProcessUtils : ERProcessUtils_ACC
  private var _erRunParam : ERRunParameter
  private var _erParamClaimsExcluded : ERParamClaimsExcluded_ACC[]
  private var _listExpYears : Integer[]
  private var _mixedMode : Integer
  private var _erCalculationType : ERCalculationType_ACC
  private var _erRun : ERRun_ACC
  private var _erRunLevyYear : Integer
  construct () {
    super(BatchProcessType.TC_ERGENERATECLAIMDETAILS_ACC, StandardWorkItem, ERRunLevyPayer_ACC)
    this._erProcessUtils = new ERProcessUtils_ACC()
  }

  override function findTargets(): Iterator<ERRunLevyPayer_ACC> {
    var queryRunLevyPayer = Query.make(ERRunLevyPayer_ACC)
        .compareIn(ERRunLevyPayer_ACC#ERProgramme, {ERProgramme_ACC.TC_ER, ERProgramme_ACC.TC_NCD})
    queryRunLevyPayer.join(ERRunLevyPayer_ACC#ERRun)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_INPROGRESS)
    var result = queryRunLevyPayer.select()
    return result.iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    try {
      var runLevyPayer = extractTarget(item)
      print("ACCPolicyID: " + runLevyPayer?.ACCPolicyID_ACC
          + " | BusinessGroup: " + runLevyPayer?.ERBusinessGroup?.BusinessGroupID)
      _erCalculationType = runLevyPayer.ERRunCalcResult.ERCalculationType
      _erRun = runLevyPayer.ERRun
      _erRunLevyYear = _erRun.ERRequest.LevyYear
      _erRunParam = new ERRunParameter(_erRunLevyYear)
      _erParamClaimsExcluded = _erProcessUtils.getERParamClaimsExcluded(_erRunLevyYear)
      _listExpYears = _erProcessUtils.getTargetYears(_erRunParam, Boolean.FALSE)
      _mixedMode = getCalcTypeCount(_erRunLevyYear)

      // Get ER Claim Liable Employer per levy payer (and it's transfer counterparty)
      var erClaimLiableEmployer = getERClaimLiableEmployer(runLevyPayer)
      for (cle in erClaimLiableEmployer) {
        var claimOwner = runLevyPayer
        if (cle.ACCPolicyID_ACC != runLevyPayer.ACCPolicyID_ACC)
          claimOwner = _erProcessUtils.getERRunLevyPayer(_erRun, cle.ACCPolicyID_ACC)
        var erRunClaimValues = loadERClaimLiableEmployer(cle)
        erRunClaimValues.originalERRunLevyPayer = claimOwner
        erRunClaimValues.erRunLevyPayer = claimOwner
        erRunClaimValues = getClaimDerivedValues(erRunClaimValues)
        _erProcessUtils.createERRunClaimDetail(erRunClaimValues)
      }

      // Get ER AEP Claim per levy payer
      var erAEPClaim = getERAEPClaim(runLevyPayer)
      for (eac in erAEPClaim) {
        var erRunAEPClaimValues = loadERAEPClaims(eac)
        erRunAEPClaimValues.originalERRunLevyPayer = runLevyPayer
        erRunAEPClaimValues.erRunLevyPayer = runLevyPayer
        erRunAEPClaimValues = getClaimDerivedValues(erRunAEPClaimValues)
        _erProcessUtils.createERRunClaimDetail(erRunAEPClaimValues)
      }
    } catch (e : Exception) {
      _logger.error_ACC("processWorkItem ${e.Message}", e)
    }
  }

  class ERRunDerivedCU {
    public var derivedERParamCU : ERParamCU_ACC
    public var derivedCUReason : String
  }

  function loadERClaimLiableEmployer(claim : ERClaimLiableEmployer_ACC) : ERRunClaimValues {
    var erRunClaimValues = new ERRunClaimValues()
    erRunClaimValues.claimNumber = claim.ClaimNumber
    erRunClaimValues.claimantACCNumber = claim.ClaimantACCNumber
    erRunClaimValues.claimantName = claim.ClaimantName
    erRunClaimValues.injuryDate = claim.InjuryDate
    erRunClaimValues.claimFundCode = claim.ClaimFundCode
    erRunClaimValues.claimFundDesc = claim.ClaimFundDesc
    erRunClaimValues.acceptedDate = claim.AcceptedDate
    erRunClaimValues.claimDesc = claim.ClaimDesc
    erRunClaimValues.accidentLocation = claim.AccidentLocation
    erRunClaimValues.coverDecision = claim.CoverDecision
    erRunClaimValues.isSensitive = claim.IsSensitive
    erRunClaimValues.isFatal = claim.IsFatal
    erRunClaimValues.isGradualProcess = claim.IsGradualProcess
    erRunClaimValues.isAdverse = claim.IsAdverse
    erRunClaimValues.experienceYear = claim.ExperienceYear
    erRunClaimValues.greatestModifiedDate = claim.GreatestModifiedDate
    erRunClaimValues.cntExpInjury = claim.CntExpInjury
    erRunClaimValues.primaryCodingSystem = claim.PrimaryCodingSystem
    erRunClaimValues.primaryInjuryCode = claim.PrimaryInjuryCode
    erRunClaimValues.primaryInjuryDesc = claim.PrimaryInjuryDesc
    erRunClaimValues.claimERParamCU = claim.ClaimERParamCU
    erRunClaimValues.percentLiable = claim.PercentLiable
    erRunClaimValues.erParamFundCode = claim.ERParamFundCode
    erRunClaimValues.totalWCD_Yr1 = claim.TotalWCD_Yr1
    erRunClaimValues.totalWCD_Yr2 = claim.TotalWCD_Yr2
    erRunClaimValues.totalWCD_Yr3 = claim.TotalWCD_Yr3
    erRunClaimValues.medicalSpend_Yr1 = claim.MedicalSpend_Yr1
    erRunClaimValues.medicalSpend_Yr2 = claim.MedicalSpend_Yr2
    erRunClaimValues.medicalSpend_Yr3 = claim.MedicalSpend_Yr3
    return erRunClaimValues
  }

  function loadERAEPClaims(claim : ERAEPClaims_ACC) : ERRunClaimValues {
    var encryptedClaimantName = _erProcessUtils.getACCPolicyIDName(claim.ACCPolicyID_ACC, Boolean.TRUE)
    var erRunClaimValues = new ERRunClaimValues()
    erRunClaimValues.claimNumber = claim.ClaimNumber
    erRunClaimValues.claimantACCNumber = claim.ACCPolicyID_ACC
    erRunClaimValues.injuryDate = claim.InjuryDate
    erRunClaimValues.claimERParamCU = claim.ERParamCU
    erRunClaimValues.isSensitive = claim.IsSensitive
    erRunClaimValues.isFatal = claim.IsFatal
    erRunClaimValues.isGradualProcess = claim.IsGradualProcess
    erRunClaimValues.experienceYear = claim.ExperienceYear
    erRunClaimValues.uncappedWCD = claim.UncappedWCD
    erRunClaimValues.cappedWCD = claim.CappedWCD
    erRunClaimValues.medicalSpend = claim.MedicalSpend
    // Default ER AEP Claim values
    erRunClaimValues.claimantName = encryptedClaimantName
    erRunClaimValues.claimFundCode = "6"
    erRunClaimValues.claimFundDesc = "Employers / Other Insurer"
    erRunClaimValues.acceptedDate = claim.InjuryDate
    erRunClaimValues.claimDesc = "AEP Claim"
    erRunClaimValues.isAdverse = 0
    erRunClaimValues.cntExpInjury = 0
    erRunClaimValues.percentLiable = 100
    return erRunClaimValues
  }

  function getERClaimLiableEmployer(levyPayer : ERRunLevyPayer_ACC) : Iterator<ERClaimLiableEmployer_ACC> {
    // get transfer counter paties that are NOT in the list of ACCPolicyIDs with ER/NCD
    var listTransferCounterparty = _erProcessUtils.getERTransferCounterparty(levyPayer.ERRun, {levyPayer.ACCPolicyID_ACC}, Boolean.TRUE)

    // query ER Claim Liable Employer within experience years
    var queryERClaims = Query.make(ERClaimLiableEmployer_ACC)
        .compareIn(ERClaimLiableEmployer_ACC#ExperienceYear, _listExpYears)
    queryERClaims.or(\orQry -> {
      orQry.compare(ERClaimLiableEmployer_ACC#ACCPolicyID_ACC, Relop.Equals, levyPayer.ACCPolicyID_ACC)
      orQry.compareIn(ERClaimLiableEmployer_ACC#ACCPolicyID_ACC, listTransferCounterparty)
    })
    return queryERClaims.select().iterator()
  }

  function getERAEPClaim(levyPayer : ERRunLevyPayer_ACC) : Iterator<ERAEPClaims_ACC> {
    // query ER AEP Claim in levy year
    var queryERAEPClaims = Query.make(ERAEPClaims_ACC)
        .compare(ERAEPClaims_ACC#LevyApplicationYear, Relop.Equals, _erRunLevyYear)
    queryERAEPClaims.join("ACCPolicyID_ACC", ERAEPExits_ACC, "ACCNumber")
        .compare(ERAEPExits_ACC#LevyApplicationYear, Relop.Equals, queryERAEPClaims.getColumnRef("LevyApplicationYear"))
    queryERAEPClaims.compare(ERAEPClaims_ACC#ACCPolicyID_ACC, Relop.Equals, levyPayer.ACCPolicyID_ACC)
    return queryERAEPClaims.select().iterator()
  }

  function getCalcTypeCount(levyYear : Integer) : Integer {
    return Query.make(ERCalcTypeLevyYear_ACC)
        .compare(ERCalcTypeLevyYear_ACC#LevyYear, Relop.Equals, levyYear)
        .select()*.ERCalculationType.toSet().size()
  }

  function getClaimDerivedValues(claim : ERRunClaimValues) : ERRunClaimValues {
    var erBusinessGroup = claim.erRunLevyPayer.ERBusinessGroup
    if (claim.claimDesc != "AEP Claim") {
      if (claim.experienceYear == _listExpYears[0]) {
        // if ExperienceYear is the 1st Experience Year of the Run Levy Year use Yr1 data
        claim.uncappedWCD = claim.totalWCD_Yr1 != null ? claim.totalWCD_Yr1.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO
        claim.medicalSpend = claim.medicalSpend_Yr1 != null ? claim.medicalSpend_Yr1.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO
      } else if (claim.experienceYear == _listExpYears[1]) {
        // if ExperienceYear is the 2nd Experience Year of the Run Levy Year use Yr2 data
        claim.uncappedWCD = claim.totalWCD_Yr2 != null ? claim.totalWCD_Yr2.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO
        claim.medicalSpend = claim.medicalSpend_Yr2 != null ? claim.medicalSpend_Yr2.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO
      } else if (claim.experienceYear == _listExpYears[2]) {
        // if ExperienceYear is the 3rd Experience Year of the Run Levy Year use Yr3 data
        claim.uncappedWCD = claim.totalWCD_Yr3 != null ? claim.totalWCD_Yr3.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO
        claim.medicalSpend = claim.medicalSpend_Yr3 != null ? claim.medicalSpend_Yr3.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO
      }
    }

    // set capped weekly compensasion days
    claim.cappedWCD = claim.uncappedWCD
    if (claim.uncappedWCD > _erRunParam.weeklyCompDaysCap)
      claim.cappedWCD = _erRunParam.weeklyCompDaysCap

    // set exceeds medical spend threshold flag
    claim.exceedsMSTH = 0
    if (claim.medicalSpend >= _erRunParam.medicalSpendThreshold)
      claim.exceedsMSTH = 1

    // get the derived ER Parameter CU
    var erRunDerivedCU = getDerivedCUCode(claim)
    claim.derivedERParamCU = erRunDerivedCU.derivedERParamCU
    claim.derivedCUReason = erRunDerivedCU.derivedCUReason

    // set RiskMgmtQualifying based on stored proc ERRun_IdentifyRiskManagement
    claim.isRiskMgmtQualifying = 0
    if (claim.exceedsMSTH == 1 or claim.isFatal == 1)
      claim.isRiskMgmtQualifying = 1

    // set RehabMgmtQualifying based on stored proc ERRun_IdentifyRehabManagement
    claim.isRehabMgmtQualifying = 0
    if (claim.cappedWCD > 0.00)
      claim.isRehabMgmtQualifying = 1

    // set isERGradual based on stored proc ERRun_IdentifyClaimInjuryCode
    claim.isERGradual = 0
    if (claim.isGradualProcess > 0 and (claim.cntExpInjury == null ? 0 : claim.cntExpInjury) > 0)
      claim.isERGradual = 1

    //default ER/NCD Qualifying to 1 and default IncludeInFactor to 0
    claim.isERQualifying = 1
    claim.isNCDQualifying = 1
    claim.includeInFactor = 0
    // check if ER Legacy
    if (_erCalculationType == ERCalculationType_ACC.TC_ERLEGACY) {
      // set isNCDQualifying, isERQualifying and nonQualifyingReason based on stored proc ERRun_ExcludeAdverseEvents
      if (claim.isAdverse > 0) {
        if (_mixedMode == 1)
          claim.isERQualifying = 0
        claim.isNCDQualifying = 0
        claim.nonQualifyingReason = "IsAdverse"
      }

      // set isNCDQualifying, isERQualifying and nonQualifyingReason based on stored proc ERRun_ExcludeNonQualifyingInjuryCodes
      if (claim.isGradualProcess > 0 and (claim.cntExpInjury == null ? 0 : claim.cntExpInjury) > 0) {
        if (_mixedMode == 1)
          claim.isERQualifying = 0
        claim.isNCDQualifying = 0
        claim.nonQualifyingReason = "IsERGradual"
      }

      if (claim.isSensitive == 1) {
        if (_mixedMode == 1)
          claim.isERQualifying = 0
        claim.isNCDQualifying = 0
        claim.nonQualifyingReason = "IsSensitive"
      }

    // check if (non-ER Legacy) SER1/SER2
    } else {
      // set isERQualifying and nonQualifyingReason based on stored proc ERRun_ExcludeClaimEvents
      claim.includeInFactor = 0
      for (param in _erParamClaimsExcluded) {
        if ((param.ClaimsType == "IsAdverse" and claim.isAdverse > 1)
            or (param.ClaimsType == "IsERGradual" and claim.isERGradual > 1)
            or (param.ClaimsType == "IsFatal" and claim.isFatal > 1)
            or (param.ClaimsType == "IsGradual" and claim.isGradualProcess > 1)
            or (param.ClaimsType == "IsSensitive" and claim.isSensitive > 1)) {

          if (param.IncludeInFactor == Boolean.TRUE) {
            claim.includeInFactor = 1
          }
          if (param.ExcludeFromCalc == Boolean.TRUE) {
            claim.isERQualifying = 0
            claim.nonQualifyingReason = param.ClaimsType
          }
        }
      }
    }
    return claim
  }

  function getDerivedCUCode(claim : ERRunClaimValues) : ERRunDerivedCU {
    var erBusinessGroup = claim.erRunLevyPayer.ERBusinessGroup
    var accPolicyID  = claim.erRunLevyPayer.ACCPolicyID_ACC
    var claimCU = claim.claimERParamCU

    print('erBusinessGroup:' + erBusinessGroup.BusinessGroupID
        + ' | accPolicyID:' + accPolicyID
        + ' | runLevyYear:' + _erRunLevyYear
        + ' | claimCU:' + claimCU.CUCode
        + ' | claimNumber:' + claim.claimNumber)

    var erRunDerivedCU = new ERRunDerivedCU()
    var lpAggrLEandLevyByYear : List<QueryRow>
    var lpAggrLEandLevy : List<QueryRow>
    var bgAggrLEandLevyByYear : List<QueryRow>
    var bgAggrLEandLevy : List<QueryRow>

    if (claimCU != null) {
  /* 1.a.) check if Claim CU has Levy Payer Policy with the same CUCode and Levy Year */
      lpAggrLEandLevyByYear = _erProcessUtils.getCUAggregatedLEandLevy(_erRun, null, accPolicyID, _erRunLevyYear)
      for (row in lpAggrLEandLevyByYear) {
        var policyCU = gw.api.database.Query.make(ERParamCU_ACC).compare(ERParamCU_ACC#ID, Relop.Equals, row.getColumn("ERParamCU")).select().first()
        if (claimCU.getCUCode().equalsIgnoreCase(policyCU.getCUCode())) {
          erRunDerivedCU.derivedERParamCU = policyCU
          erRunDerivedCU.derivedCUReason = 'Levy payer has liable earnings for CU in the levy year of the accident'
          return erRunDerivedCU
        }
      }

  /* 1.b.) check if Claim CU has Levy Payer Policy with the same CUCode from another experience Year */
      lpAggrLEandLevy = _erProcessUtils.getCUAggregatedLEandLevy(_erRun, null, accPolicyID, null)
      for (row in lpAggrLEandLevy) {
        var policyCU = gw.api.database.Query.make(ERParamCU_ACC).compare(ERParamCU_ACC#ID, Relop.Equals, row.getColumn("ERParamCU")).select().first()
        if (claimCU.getCUCode().equalsIgnoreCase(policyCU.getCUCode())) {
          erRunDerivedCU.derivedERParamCU = policyCU
          erRunDerivedCU.derivedCUReason = 'Levy payer has liable earnings for CU in another year of experience period'
          return erRunDerivedCU
        }
      }

      if (erBusinessGroup != null) {
  /* 1.c.) check if Claim CU has Business Group Policy with the same CUCode and Levy Year */
        bgAggrLEandLevyByYear = _erProcessUtils.getCUAggregatedLEandLevy(_erRun, erBusinessGroup, null, _erRunLevyYear)
        for (row in bgAggrLEandLevyByYear) {
          var policyCU = Query.make(ERParamCU_ACC).compare(ERParamCU_ACC#ID, Relop.Equals, row.getColumn("ERParamCU")).select().first()
          if (claimCU.getCUCode().equalsIgnoreCase(policyCU.getCUCode())) {
            erRunDerivedCU.derivedERParamCU = policyCU
            erRunDerivedCU.derivedCUReason = 'Business Group has liable earnings for CU in the levy year of the accident'
            return erRunDerivedCU
          }
        }

  /* 1.d.) check if Claim CU has Business Group Policy with the same CUCode from another experience Year */
        bgAggrLEandLevy = _erProcessUtils.getCUAggregatedLEandLevy(_erRun, erBusinessGroup, null, null)
        for (row in bgAggrLEandLevy) {
          var policyCU = Query.make(ERParamCU_ACC).compare(ERParamCU_ACC#ID, Relop.Equals, row.getColumn("ERParamCU")).select().first()
          if (claimCU.getCUCode().equalsIgnoreCase(policyCU.getCUCode())) {
            erRunDerivedCU.derivedERParamCU = policyCU
            erRunDerivedCU.derivedCUReason = 'Business Group has liable earnings for CU in another year of experience period'
            return erRunDerivedCU
          }
        }
      }
    }

  /* 2.a.) get CU from Levy Payer policy with greatest Levy Due, within the year of injury date */
//    lpAggrLEandLevyByYear = _erProcessUtils.getCUAggregatedLEandLevy(_erRun, null, accPolicyID, _erRunLevyYear)
    if (lpAggrLEandLevyByYear.Count > 0) {
      var policyCU = Query.make(ERParamCU_ACC).compare(ERParamCU_ACC#ID, Relop.Equals, lpAggrLEandLevyByYear.first().getColumn("ERParamCU")).select().first()
      erRunDerivedCU.derivedERParamCU = policyCU
      erRunDerivedCU.derivedCUReason = 'Levy payer has liable earnings for another CU in the levy year of the accident'
      return erRunDerivedCU
    }

  /* 2.b.) get CU from Levy Payer policy with greatest Levy Due, from another experience year */
//    lpAggrLEandLevy = _erProcessUtils.getCUAggregatedLEandLevy(_erRun, null, accPolicyID, null)
    if (lpAggrLEandLevy.Count > 0) {
      var policyCU = Query.make(ERParamCU_ACC).compare(ERParamCU_ACC#ID, Relop.Equals, lpAggrLEandLevy.first().getColumn("ERParamCU")).select().first()
      erRunDerivedCU.derivedERParamCU = policyCU
      erRunDerivedCU.derivedCUReason = 'Levy payer has liable earnings for another CU in another year of experience period'
      return erRunDerivedCU
    }

    if (erBusinessGroup != null) {
  /* 3.a.) get CU from Business Group policy with greatest Levy Due, within the year of injury date */
//      bgAggrLEandLevyByYear = _erProcessUtils.getCUAggregatedLEandLevy(_erRun, erBusinessGroup, null, _erRunLevyYear)
      if (bgAggrLEandLevyByYear.Count > 0) {
        var policyCU = Query.make(ERParamCU_ACC).compare(ERParamCU_ACC#ID, Relop.Equals, bgAggrLEandLevyByYear.first().getColumn("ERParamCU")).select().first()
        erRunDerivedCU.derivedERParamCU = policyCU
        erRunDerivedCU.derivedCUReason = 'Business Group has liable earnings for another CU in the levy year of the accident'
        return erRunDerivedCU
      }

  /* 3.b.)  get CU from Business Group policy with greatest Levy Due, from another experience year */
//      bgAggrLEandLevy = _erProcessUtils.getCUAggregatedLEandLevy(_erRun, erBusinessGroup, null, null)
      if (bgAggrLEandLevy.Count > 0) {
        var policyCU = Query.make(ERParamCU_ACC).compare(ERParamCU_ACC#ID, Relop.Equals, bgAggrLEandLevy.first().getColumn("ERParamCU")).select().first()
        erRunDerivedCU.derivedERParamCU = policyCU
        erRunDerivedCU.derivedCUReason = 'Business Group has liable earnings for another CU in another year of experience period'
        return erRunDerivedCU
      }
    }

  /* 3.c.) use the claim CU if there is NO policy with Liable Earnings within the experience period */
    erRunDerivedCU.derivedERParamCU = claimCU
    erRunDerivedCU.derivedCUReason = 'Levy payer has no liable earnings in any year of the experience period'
    return erRunDerivedCU
  }
}
