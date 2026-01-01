package nz.co.acc.integration.junoinformationservice.payloadgenerator.policy

uses edge.util.helper.CurrencyOpUtil
uses entity.PolicyLine
uses gw.api.locale.DisplayKey
uses nz.co.acc.edge.capabilities.policy.lob.util.PolicyLineUtil_ACC
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONAEPCost
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONAEPMemberCUData
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONAEPMemberData
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONAEPRateableCUData
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONAEPStopLossCost
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONBICCode
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONCPXCoverage
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONLiableEarningsAEP
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONLiableEarningsEmployer
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONLiableEarningsIndividual
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONLiableEarningsShareholder
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONLiableEarningsShareholders
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONPolicyLineAEP
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONPolicyLineBase
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONPolicyLineCP
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONPolicyLineCPX
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONPolicyLineWPC
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONPolicyLineWPS
uses nz.co.acc.integration.junoinformationservice.model.policy.IGSONPolicyLine
uses nz.co.acc.lob.cpx.INDCPXCovUtil_ACC
uses productmodel.CWPSLine
uses productmodel.EMPWPCLine
uses productmodel.INDCPXLine
uses productmodel.INDCoPLine

uses java.math.BigDecimal

/**
 * Uses code copied from Portal plugins
 */
class PolicyLineGsonGenerator {

  final static var PREMIUM_CHARGE_PATTERNS = {
      ChargePattern.TC_WSL,
      ChargePattern.TC_WAL,
      ChargePattern.TC_EL,
      ChargePattern.TC_WARP,
      ChargePattern.TC_ERP,
      ChargePattern.TC_WAL_CPX,
      ChargePattern.TC_WSL_CPX,
      ChargePattern.TC_EL_CPX
  }.toSet().freeze()

  function generate(entity : PolicyLine, isAEPContract: Boolean = false) : IGSONPolicyLine {
    if (entity == null) {
      return null
    }

    if (entity typeis INDCoPLine) {
      return generateCP(entity)

    } else if (entity typeis INDCPXLine) {
      return generateCPX(entity)

    } else if (entity typeis EMPWPCLine) {
      return generateWPC(entity)

    } else if (entity typeis CWPSLine) {
      return generateWPS(entity)

    } else if (entity typeis AEPLine) {
      return generateAEP(entity, isAEPContract)

    } else {
      throw new RuntimeException("Unexpected policy line ${entity}")
    }
  }

  private function generateCP(policyLine : INDCoPLine) : GSONPolicyLineCP {
    var gsonDoc = new GSONPolicyLineCP()
    fillBaseProperties(gsonDoc, policyLine)

    gsonDoc.policyType = "CP"
    gsonDoc.levyCost = policyLine.Costs.sum(\elt -> elt.ActualAmountBilling.Amount)?:BigDecimal.ZERO
    gsonDoc.bicCodes = policyLine.BICCodes.fastList().map(\bicCode -> new GSONBICCode(bicCode))
    gsonDoc.totalPremium = getTotalPremium(policyLine)

    var earnings : INDLiableEarnings_ACC = null
    var previousYearEarnings : INDLiableEarnings_ACC = null
    var policyPeriod = policyLine.Branch

    earnings = policyLine.INDCoPCovs.first().ActualLiableEarningsCov
    previousYearEarnings = policyLine.INDCoPCovs.first().LiableEarningCov
    var employmentStatus = earnings.FullTime ?
        DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.FullTime")
        : DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.PartTime")
    var previousYearEmploymentStatus = previousYearEarnings.FullTime ?
        DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.FullTime")
        : DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.PartTime")


    //Levy Year  before 2020
    if (policyPeriod.IsBeforeTransitionYear) {
        gsonDoc.earnings = generateLiableEarningsIndividual(previousYearEarnings)
        gsonDoc.earnings.taxYear = policyPeriod.getLevyYear_ACC() - 1
        gsonDoc.employmentStatus = previousYearEmploymentStatus
    }
    // Levy Year 2020 and onwards
    else if (policyPeriod.IsNewLERuleAppliedYear) {
      gsonDoc.earnings = generateLiableEarningsIndividual(earnings)
      gsonDoc.earnings.taxYear = policyPeriod.getLevyYear_ACC()
      gsonDoc.employmentStatus = employmentStatus
      // Levy Year 2020
      if (policyPeriod.IsLETransitionYear) {
        gsonDoc.previousYearEarnings = generateLiableEarningsIndividual(previousYearEarnings)
        gsonDoc.previousYearEarnings.taxYear = policyPeriod.getLevyYear_ACC() - 1
      }
    }

    return gsonDoc
  }

  private function generateCPX(policyLine : INDCPXLine) : GSONPolicyLineCPX {
    var gsonDoc = new GSONPolicyLineCPX()
    fillBaseProperties(gsonDoc, policyLine)

    gsonDoc.policyType = "CPX"
    gsonDoc.levyCost = policyLine.Costs.sum(\elt -> elt.ActualAmountBilling.Amount)?:BigDecimal.ZERO
    gsonDoc.totalPremium = getTotalPremium(policyLine)

    gsonDoc.employmentStatus = policyLine.EmploymentStatus ?
        DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.FullTime")
        : DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.PartTime")

    gsonDoc.businessStructure = policyLine.BusinessStructure.DisplayName

    var minMax = INDCPXCovUtil_ACC.findMinMaxCPXValues(policyLine.Branch.PeriodStart)
    gsonDoc.minimumCoverPermitted = minMax.First
    gsonDoc.maximumCoverPermitted = minMax.Second

    var cpxInfoCovs = policyLine.INDCPXCovs.first().CPXInfoCovs.toList()
    gsonDoc.coverages = cpxInfoCovs.toList().map(\cov -> createBaseCPXCoverable(cov))
    gsonDoc.bicCodes = policyLine.BICCodes.fastList().map(\bicCode -> new GSONBICCode(bicCode))

    return gsonDoc
  }

  private function generateWPC(policyLine : EMPWPCLine) : GSONPolicyLineWPC {
    var gsonDoc = new GSONPolicyLineWPC()
    fillBaseProperties(gsonDoc, policyLine)
    gsonDoc.policyType = "WPC"
    gsonDoc.levyCost = policyLine.Costs.sum(\elt -> elt.ActualAmountBilling.Amount)?:BigDecimal.ZERO
    gsonDoc.bicCodes = policyLine.BICCodes.fastList().map(\bicCode -> new GSONBICCode(bicCode))
    gsonDoc.totalPremium = getTotalPremium(policyLine)
    gsonDoc.earnings = generateLiableEarningsEmployer(policyLine)
    return gsonDoc
  }

  private function generateAEP(policyLine : AEPLine, isAEPContract: Boolean) : GSONPolicyLineAEP {
    var gsonDoc = new GSONPolicyLineAEP()
    fillBaseProperties(gsonDoc, policyLine)
    gsonDoc.policyType = "AEP"
    gsonDoc.auditResult = policyLine.AuditResult.Code
    gsonDoc.contractPlanType = policyLine.ContractPlanType.Code
    gsonDoc.claimManagementPeriod = policyLine.ClaimManagementPeriod.Code
    gsonDoc.highCostClaimsCover = mapHighCostClaimsCover(policyLine.HighCostClaimsCover)
    gsonDoc.stopLossPercentage = policyLine.StopLossPercentage
    gsonDoc.stopLossLimit = policyLine.StopLossLimit
    if (isAEPContract) {
      gsonDoc.earnings = generateLiableEarningsAEP(policyLine)
      gsonDoc.costs = policyLine.AEPCosts.map(\cost -> createAEPCost(cost))
      gsonDoc.liableEarningsSummaryByCu = policyLine.AEPRateableCUData.fastList().map(\data -> mapAEPRateableCUData(data))
      gsonDoc.liableEarningsSummaryByMember = policyLine.AEPMemberData.fastList().map(\data -> mapAEPMemberData(data))
    }
    return gsonDoc
  }

  private function generateWPS(policyLine : CWPSLine) : GSONPolicyLineWPS {
    var gsonDoc = new GSONPolicyLineWPS()
    fillBaseProperties(gsonDoc, policyLine)
    gsonDoc.policyType = "WPS"
    gsonDoc.levyCost = policyLine.Costs.sum(\elt -> elt.ActualAmountBilling.Amount)?:BigDecimal.ZERO
    gsonDoc.bicCodes = policyLine.BICCodes.fastList().map(\bicCode -> new GSONBICCode(bicCode))
    gsonDoc.totalPremium = getTotalPremium(policyLine)
    gsonDoc.applyInflation = policyLine.CWPSCovs.first().ApplyInflation
    gsonDoc.earnings = generateShareholderEarnings(policyLine)
    return gsonDoc
  }

  private function fillBaseProperties(gsonDoc : GSONPolicyLineBase, policyLine : PolicyLine) {
    gsonDoc.publicId = policyLine.PublicID
    gsonDoc.expirationDate = policyLine.ExpirationDate.toISODate()
    gsonDoc.effectiveDate = policyLine.EffectiveDate.toISODate()
  }

  private function getTotalPremium(policyLine : PolicyLine) : BigDecimal {
    return CurrencyOpUtil.sum(policyLine.Costs.where(\cost -> PREMIUM_CHARGE_PATTERNS.contains(cost.ChargePattern))).Amount
  }

  private function generateLiableEarningsIndividual(earnings : INDLiableEarnings_ACC) : GSONLiableEarningsIndividual {
    var gsonDoc = new GSONLiableEarningsIndividual()
    gsonDoc.adjustedLiableEarnings = earnings.AdjustedLiableEarnings
    gsonDoc.adjustedLtcIncome = earnings.AdjustedLTCIncome
    gsonDoc.earningsNotLiable = earnings.EarningNotLiable
    gsonDoc.netSchedularPayments = earnings.NetSchedulerPayments
    gsonDoc.selfEmployedNetIncome = earnings.SelfEmployedNetIncome
    gsonDoc.totalActivePartnershipIncome = earnings.TotalActivePartnershipInc
    gsonDoc.totalGrossIncome = earnings.TotalGrossIncome
    gsonDoc.totalIncomeNotLiable = earnings.TotalIncomeNotLiable
    gsonDoc.totalLiableEarnings = earnings.TotalLiableEarnings
    gsonDoc.totalOtherExpensesClaimed = earnings.TotalOtherExpensesClaimed
    gsonDoc.totalOtherNetIncome = earnings.TotalOtherNetIncome
    gsonDoc.totalOverseasIncome = earnings.TotalOverseasIncome
    gsonDoc.totalShareholderEmplSalary = earnings.TotalShareholderEmplSalary

    return gsonDoc
  }

  private function generateLiableEarningsEmployer(policyLine : EMPWPCLine) : GSONLiableEarningsEmployer {
    var earnings = policyLine.EMPWPCCovs.first().LiableEarningCov

    var gsonDoc = new GSONLiableEarningsEmployer()
    gsonDoc.adjustedLiableEarnings = earnings.AdjustedLiableEarnings
    gsonDoc.embassyWorkerEarnings = earnings.EmbassyWorkerEarnings_ACC
    gsonDoc.eraChangedDate = earnings.ERAChangedDate_ACC?.toISODate()
    gsonDoc.eraContractNumber = earnings.ERAContractNumber_ACC
    gsonDoc.eraIndicator = earnings.ERAIndicator_ACC
    gsonDoc.inflationAdjustmentApplied = earnings.InfltnAdjustmntApplied
    gsonDoc.isEmbassyWorker = earnings.EmbassyWorker_ACC
    gsonDoc.paymentAfterFirstWeek = earnings.PaymentAfterFirstWeek
    gsonDoc.paymentToEmployees = earnings.PaymentToEmployees
    gsonDoc.totalEarningsNotLiable = earnings.TotalEarningsNotLiable
    gsonDoc.totalExcessPaid = earnings.TotalExcessPaid
    gsonDoc.totalGrossEarnings = earnings.TotalGrossEarnings
    gsonDoc.totalLiableEarnings = earnings.TotalLiableEarnings
    gsonDoc.totalSchedularPayments = earnings.TotalPAYE
    return gsonDoc
  }

  private function generateLiableEarningsAEP(policyLine : AEPLine) : GSONLiableEarningsAEP {
    var gsonDoc = new GSONLiableEarningsAEP()
    gsonDoc.adjustedLiableEarnings = policyLine.AdjustedLiableEarnings
    gsonDoc.paymentForFirstWeek = policyLine.PaymentForFirstWeek
    gsonDoc.paymentAfterFirstWeek = policyLine.PaymentAfterFirstWeek
    gsonDoc.totalEarningsNotLiable = policyLine.TotalEarningsNotLiable
    gsonDoc.totalExcessPaid = policyLine.TotalExcessPaid
    gsonDoc.totalGrossEarnings = policyLine.TotalGrossEarnings
    gsonDoc.totalLiableEarnings = policyLine.TotalLiableEarnings
    gsonDoc.totalSchedularPayments = policyLine.TotalPAYE
    return gsonDoc
  }

  private function generateShareholderEarnings(policyLine : CWPSLine) : GSONLiableEarningsShareholders {
    var shareholders = policyLine.PolicyShareholders.toList()
        .map(\shareholder -> generateShareholderEarnings(shareholder.ShareholderEarnings.first()))

    var gsonDoc = new GSONLiableEarningsShareholders()

    // rolled up totals
    gsonDoc.adjustedLiableEarnings = shareholders.sum(\sh -> sh.adjustedLiableEarnings)
    gsonDoc.adjustedLiableEarningsLessCpx = shareholders.sum(\sh -> sh.adjustedLiableEarningsLessCpx)
    gsonDoc.auditAdjustedLiableEarningsLessCpx = shareholders.sum(\sh -> sh.auditAdjustedLiableEarningsLessCpx)
    gsonDoc.excessMax = shareholders.sum(\sh -> sh.excessMax)
    gsonDoc.firstWeek = shareholders.sum(\sh -> sh.firstWeek)
    gsonDoc.postWeek = shareholders.sum(\sh -> sh.postWeek?:0.00bd)
    gsonDoc.liableEarnings = shareholders.sum(\sh -> sh.liableEarnings)
    gsonDoc.remuneration = shareholders.sum(\sh -> sh.remuneration)

    // individual shareholder earnings
    gsonDoc.shareHolders = shareholders

    return gsonDoc
  }

  private function generateShareholderEarnings(earnings : ShareholderEarnings_ACC) : GSONLiableEarningsShareholder {
    var gsonDoc = new GSONLiableEarningsShareholder()
    gsonDoc.adjustedLiableEarnings = earnings.AdjustedLiableEarnings_amt
    gsonDoc.adjustedLiableEarningsLessCpx = earnings.AdjustedLELessCpx_amt
    gsonDoc.auditAdjustedLiableEarningsLessCpx = earnings.AuditAdjustedLELessCpx_amt
    gsonDoc.excessMax = earnings.ExcessMax_amt
    gsonDoc.firstWeek = earnings.FirstWeek_amt
    gsonDoc.postWeek = earnings.PostWeek_amt
    gsonDoc.liableEarnings = earnings.LiableEarnings_amt
    gsonDoc.remuneration = earnings.Remuneration_amt
    gsonDoc.cuCode = earnings.CUCode
    gsonDoc.contactAccId = earnings.ShareholderID.PolicyContact.ACCID_ACC
    gsonDoc.contactPublicId = earnings.ShareholderID.PolicyContact.PublicID
    return gsonDoc
  }

  private function createBaseCPXCoverable(coverable : CPXInfoCov_ACC) : GSONCPXCoverage {
    final var gson = new GSONCPXCoverage()
    gson.publicId = coverable.PublicID
    var portalDto = PolicyLineUtil_ACC.createBaseCPXCoverable(coverable)
    gson.agreedLevelOfCover = portalDto.AgreedLevelOfCover
    gson.requestedLevelOfCover = portalDto.RequestedLevelOfCover
    gson.periodStart = portalDto.PeriodStart.toISODate()
    gson.periodEnd = portalDto.PeriodEnd.toISODate()
    gson.applicationReceived = portalDto.ApplicationReceived?.toISODate()
    gson.coverType = portalDto.CoverType
    gson.maxCoverPermitted = portalDto.MaxCoverPermitted
    return gson
  }

  private function mapHighCostClaimsCover(hccc: AEPHighCostClaimsCov_ACC): Integer {
    if (hccc == null) {
      return null
    }
    switch (hccc.Code) {
      case "1" : return 250000
      case "2" : return 500000
      case "3" : return 750000
      case "4" : return 1000000
      case "5" : return 0
      case "6" : return 1500000
      case "7" : return 2000000
      case "8" : return 2500000
      default: throw new RuntimeException("AEPHighCostClaimsCov_ACC code ${hccc.Code} is not mapped")
    }
  }

  private function mapAEPMemberCUData(data: AEPMemberCUData_ACC): GSONAEPMemberCUData {
    var dto = new GSONAEPMemberCUData()
    dto.publicId = data.PublicID
    dto.cuCode = data.CUCode
    dto.cuDescription = data.CUDescription
    dto.liableEarnings = data.LiableEarnings
    dto.proratedLiableEarnings = data.ProratedLiableEarnings
    dto.liableEarningsOverride = data.LiableEarningsOverride
    dto.newAepCustomer = data.NewAEPCustomer
    dto.ceasedCustomerTrading = data.CeasedCustomerTrading
    return dto
  }
  
  private function mapAEPMemberData(data: AEPMemberData_ACC): GSONAEPMemberData {
    var dto = new GSONAEPMemberData()
    dto.publicId = data.PublicID
    dto.accId = data.ACCNumber
    dto.companyName = data.CompanyName
    dto.productCode = data.ProductCode
    dto.productName = data.ProductName
    dto.policyNumber = data.PolicyNumber
    dto.termDaysForProration = data.TermDaysForProration
    dto.totalGrossEarnings = data.TotalGrossEarnings
    dto.totalEarningsNotLiable = data.TotalEarningsNotLiable
    dto.totalPaye = data.TotalPAYE
    dto.totalExcessPaid = data.TotalExcessPaid
    dto.totalLiableEarnings = data.TotalLiableEarnings
    dto.adjustedLiableEarnings = data.AdjustedLiableEarnings
    dto.adjustedLiableEarningsLessCpx = data.AdjustedLiableEarningsLessCpx
    dto.paymentForFirstWeek = data.PaymentForFirstWeek
    dto.paymentAfterFirstWeek = data.PaymentAfterFirstWeek
    dto.newAepCustomer = data.NewAEPCustomer
    dto.ceasedCustomerTrading = data.CeasedCustomerTrading
    dto.aepMemberCuData = data.AEPMemberCUData.map(\cu -> mapAEPMemberCUData(cu))
    return dto
  }

  private function mapAEPRateableCUData(data: AEPRateableCUData_ACC): GSONAEPRateableCUData {
    var dto = new GSONAEPRateableCUData()
    dto.publicId = data.PublicID
    dto.cuCode = data.CUCode
    dto.cuDescription = data.CUDescription
    dto.liableEarnings = data.LiableEarnings
    dto.standardLevy = data.StandardLevy
    dto.workRate = data.WorkRate
    return dto
  }

  private function createAEPCost(cost: AEPCost_ACC) : GSONAEPCost {
    if (cost typeis AEPStopLossLevyCost_ACC) {
      return new GSONAEPStopLossCost(cost)
    } else {
      return new GSONAEPCost(cost)
    }
  }

}