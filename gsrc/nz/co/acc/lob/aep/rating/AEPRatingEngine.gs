package nz.co.acc.lob.aep.rating

uses entity.AEPRateableCUData_ACC
uses gw.api.util.CurrencyUtil
uses gw.api.util.MonetaryAmounts
uses gw.entity.IEntityType
uses gw.financials.Prorater
uses gw.job.RenewalProcess
uses gw.pl.persistence.core.Key
uses gw.plugin.Plugins
uses gw.plugin.policyperiod.IPolicyTermPlugin
uses gw.rating.CostData
uses gw.rating.CostDataWithOverrideSupport

uses java.util.Date
uses java.math.BigDecimal
uses java.lang.Iterable
uses java.math.RoundingMode

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.util.AEPUtil
uses nz.co.acc.migration.rating.AbstractMigrationRatingEngine_ACC
uses typekey.*
uses typekey.AEPCost_ACC

class AEPRatingEngine extends AbstractMigrationRatingEngine_ACC<AEPLine_ACC> {

  static var _LOG = StructuredLogger.CONFIG.withClass(AEPRatingEngine)
  static var _LOG_TAG = "${AbstractMigrationRatingEngine_ACC.Type.RelativeName} - "
  var _baseRatingDate : Date
  var _uwCompanyRateFactor : BigDecimal

  construct(line : AEPLine_ACC) {
    this(line, RateBookStatus.TC_ACTIVE)
  }

  construct(line : AEPLine_ACC, minimumRatingLevel : RateBookStatus) {
    super(line, minimumRatingLevel)
    _baseRatingDate = line.Branch.RateAsOfDate
    _uwCompanyRateFactor = line.Branch.getUWCompanyRateFactor(_baseRatingDate, _jurisdiction)
    _minimumRatingLevel = minimumRatingLevel
    _renewal = line.Branch.JobProcess typeis RenewalProcess
    _linePatternCode = line.PatternCode
  }

  override protected function rateSlice(lineVersion : AEPLine_ACC) {
    //assertSliceMode(lineVersion)

    if (lineVersion.Branch.isCanceledSlice()) {
      // Do nothing if this is a canceled slice
    } else {
      // Implementation moved over to rateWindow
    }
  }

  /******
   * This default version of this method will not create any costs for the entire period.  Instead, it assumes that all costs are created
   * as part of calculating the pro rata premium for each slice of effective time.  If a policy does need to create Costs for the entire
   * period (such as a cancellation short rate penalty or a non-linear premium discount), then this method should be overridden to implement
   * that logic.
   ******/
  override protected function rateWindow(line : AEPLine_ACC) {
    var logMsg = "Rating across policy term..."
    if (_logger.DebugEnabled) {
      _logger.debug(logMsg)
    }

    /***********
     *
     * Rating logic for rating 1 slice of the line goes here
     *
     ***********/
    if (line.Branch.AEPLineExists) {
      this.Audit = line.JobType == typekey.Job.TC_AUDIT

      if (line == null) {
        var msg = "Failed to rate..."
        throw new IllegalArgumentException(msg)
      }

      var totalWorkAccountLevyAmount = calculateWorkAccountLevy(line)
      calculateAdminFeeCostLevy(line, totalWorkAccountLevyAmount)
      calculatePrimaryHealthCostLevy(line, totalWorkAccountLevyAmount)
      var discountedWorkAccountLevyAmount = calculateAuditDiscountLevy(line, totalWorkAccountLevyAmount)
      calculateStopLossLimit(line, totalWorkAccountLevyAmount, discountedWorkAccountLevyAmount)

      if (line.ContractPlanType == AEPContractPlanType_ACC.TC_FULL_SELF_COVER) {
        if (line.HighCostClaimsCover != null) {
          calculateHighClaimsCost(line, discountedWorkAccountLevyAmount)
        }
        totalWorkAccountLevyAmount = calculateBulkHealthCostLevy(line, discountedWorkAccountLevyAmount)
      } else {
        calculatePartnershipProgrammeDiscount(line)
      }

      if (Audit) {
        // Only perform this rating if the policy effective date is before the ACC Work Residual Levy End Date
        if (DateUtil_ACC.isDatePriorACCWorkResidualLevyEndDate(PolicyLine.ExpirationDate)) {
          rateResidualWorkAccountLevy(line)
        }
        rateWorkingSaferLevy(line)
      }

      if (line.ContractPlanType == AEPContractPlanType_ACC.TC_PARTNERSHIP_DISCOUNT) {
        var costsDatas = CostDatas?.where(\costData ->
            !(costData typeis AEPWorkAccountDiscountCostData)
                and !(costData typeis AEPAuditNegatedLevyCostData))
        var taxDeductibleSubTotal = costsDatas.sum(\c -> c.ActualAmountBilling.Amount)?:BigDecimal.ZERO
        calculateGST(taxDeductibleSubTotal, true)
      } else {
        calculateGST()
      }
    }

    if (line.ContractPlanType == AEPContractPlanType_ACC.TC_FULL_SELF_COVER) {
      line.AssociatedPolicyPeriod.AccreditedEmployerLevy = CostDatas.sum(CurrencyUtil.DefaultCurrency, \elt -> ((elt typeis AEPAdministrationFeeCostData)
          or (elt typeis AEPStopLossLevyCostData) or (elt typeis AEPPrimaryHealthCostData) or (elt typeis AEPBulkFundedHealthCostData) or (elt typeis AEPHighCostClaimsCoverCostData)) ? elt.ActualAmountBilling : MonetaryAmounts.zeroOf(CurrencyUtil.DefaultCurrency))
    }
    if (line.ContractPlanType == AEPContractPlanType_ACC.TC_PARTNERSHIP_DISCOUNT) {
      line.AssociatedPolicyPeriod.AccreditedEmployerLevy = CostDatas.sum(CurrencyUtil.DefaultCurrency, \elt -> ((elt typeis AEPAdministrationFeeCostData)
          or (elt typeis AEPStopLossLevyCostData) or (elt typeis AEPPrimaryHealthCostData) or (elt typeis AEPPartnershipPlanDiscountCostData) or (elt typeis AEPAuditDiscountLevyCostData) or (elt typeis AEPWorkAccountLevyCostData)) ? elt.ActualAmountBilling : MonetaryAmounts.zeroOf(CurrencyUtil.DefaultCurrency))
    }

    if (_logger.DebugEnabled) {
      _logger.debug(logMsg + " done")
    }
  }

  private function calculateWorkAccountLevy(line : AEPLine_ACC) : BigDecimal {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)
    var totalWorkAccountLevy = BigDecimal.ZERO

    for (cuData in line.AEPRateableCUData) {
      var data = new AEPWorkAccountLevyCostData(start, end, line.getPreferredCoverageCurrency(), RateCache, cuData.FixedId)
      var existingCost = data.getExistingCost(line)
      var effectiveDate = PolicyLine.EffectiveDate
      data.RateBook = RateBook
      data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
      data.RoundingLevel = 2

      if (line.ContractPlanType == AEPContractPlanType_ACC.TC_PARTNERSHIP_DISCOUNT) {
        data.ChargePattern = ChargePattern.TC_AEP_PPD
      } else {
        data.ChargePattern = ChargePattern.TC_PREMIUM
      }

      // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
      // into the routine so it can do rate capping.
      var priorLine = line.BasedOn
      while (priorLine != null and priorLine.Branch.PolicyTerm == line.Branch.PolicyTerm) {
        priorLine = priorLine.BasedOn
      }

      var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
          {TC_POLICYLINE->PolicyLine,
              TC_TAXABLEBASIS->cuData.LiableEarnings.Amount,
              TC_CLASSIFICATIONUNIT->cuData.CUCode,
              TC_LEVYRATEEFFECTIVEDATE->effectiveDate,
              TC_ER_OR_NCD->BigDecimal.ZERO,
              TC_WSD_OR_WSMP->BigDecimal.ZERO}

      RateBook.executeCalcRoutine(WORK_ACCOUNT_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
          :paramSet = rateRoutineParameterMap)

      data.copyStandardColumnsToActualColumns()
      preventProRataOfLevy(data)
      if (data.Overridable) {
        if (existingCost.OverrideReason != "Below Premium Threshold") {
          data.copyOverridesFromCost(existingCost)
        }
        computeValuesFromCostOverrides(existingCost, data, false)
      }

      totalWorkAccountLevy += data.ActualAmount

      addCost(data)

      if (line.ContractPlanType == AEPContractPlanType_ACC.TC_FULL_SELF_COVER) {
        rateWorkAccountDiscount(line, cuData, data)
      }
    }

    return totalWorkAccountLevy
  }

  private function rateWorkAccountDiscount(line : AEPLine_ACC, cuData : AEPRateableCUData_ACC, costData : AEPCostData) {
    if (costData.ActualAmount > 0) {
      var start = line.SliceDate
      var end = getNextSliceDateAfter(start)

      var data = new AEPWorkAccountDiscountCostData(start, end, line.getPreferredCoverageCurrency(), RateCache, cuData.FixedId)
      data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
      data.RoundingLevel = 2
      data.StandardAmount = costData.ActualAmount.negate()
      data.StandardTermAmount = costData.ActualTermAmount.negate()
      data.StandardBaseRate = costData.ActualBaseRate
      data.StandardAdjRate = costData.ActualAdjRate

      data.copyStandardColumnsToActualColumns()
      data.ActualAdjRate = data.StandardAdjRate
      data.ActualBaseRate = data.StandardBaseRate
      addCost(data)
    }
  }

  private function rateResidualWorkAccountLevy(line : AEPLine_ACC) {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)

    for (cuData in line.AEPRateableCUData) {
      var data = new AEPResidualWorkAccountLevyCostData(start, end, line.getPreferredCoverageCurrency(), RateCache, cuData.FixedId)
      var existingCost = data.getExistingCost(line)
      var effectiveDate = PolicyLine.EffectiveDate
      data.RateBook = RateBook
      data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
      data.ChargePattern = ChargePattern.TC_WARP
      data.RoundingLevel = 2

      // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
      // into the routine so it can do rate capping.
      var priorLine = line.BasedOn
      while (priorLine != null and priorLine.Branch.PolicyTerm == line.Branch.PolicyTerm) {
        priorLine = priorLine.BasedOn
      }

      var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
          {TC_POLICYLINE->line,
              TC_TAXABLEBASIS->cuData.LiableEarnings.Amount,
              TC_CLASSIFICATIONUNIT->cuData.CUCode,
              TC_LEVYRATEEFFECTIVEDATE->effectiveDate}

      RateBook.executeCalcRoutine(WORK_RESIDUAL_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
          :paramSet = rateRoutineParameterMap)

      data.copyStandardColumnsToActualColumns()
      preventProRataOfLevy(data)
      if (data.Overridable) {
        if (existingCost.OverrideReason != "Below Premium Threshold") {
          data.copyOverridesFromCost(existingCost)
        }
        computeValuesFromCostOverrides(existingCost, data, false)
      }

      // call addCost() to add the new cost to the collection
      addCost(data)
    }
  }

  private function createTaxableCost(lineVersion : AEPLine_ACC) : BigDecimal {
    var taxableCost = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)

    for (cuData in lineVersion.AEPRateableCUData) {
      taxableCost = taxableCost.add(cuData.LiableEarnings.Amount)
    }

    return taxableCost
  }

  private function rateWorkingSaferLevy(lineVersion : AEPLine_ACC) {

    // create an empty CostData -- amounts will be filled in by the rate routine
    var start = lineVersion.SliceDate
    var end = getNextSliceDateAfter(start)

    var data = new AEPWorkingSaferLevyCostData(start, end, lineVersion.getPreferredCoverageCurrency(), RateCache)
    var existingCost = data.getExistingCost(lineVersion)
    var effectiveDate = lineVersion.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern = ChargePattern.TC_WSL
    data.RoundingLevel = 2

    var taxableCost = createTaxableCost(lineVersion)

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE->lineVersion,
            TC_TAXABLEBASIS->taxableCost,
            TC_LEVYRATEEFFECTIVEDATE->effectiveDate}

    RateBook.executeCalcRoutine(WORKING_SAFER_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    preventProRataOfLevy(data)
    if (data.Overridable) {
      data.copyOverridesFromCost(existingCost)
      computeValuesFromCostOverrides(existingCost, data, true)
    } else {
      data.updateAmountFields(RoundingMode, lineVersion.Branch.PeriodStart)
    }

    if (_logger.DebugEnabled) {
      _logger.debug("Rate LE Coverage")
      _logger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
      _logger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
      _logger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
    }

    // call addCost() to add the new cost to the collection
    addCost(data)
  }

  // Chris A 27/01/2021 JUNO-7123 Remove AEP Discount Rate
  public function getAuditDiscount(levyYear : int, accID_ACC : String) : BigDecimal {
    return AEPUtil.getAuditDiscount(levyYear, accID_ACC, (PolicyLine).AuditResult) / 100
  }

  private function calculatePartnershipProgrammeDiscount(line : AEPLine_ACC) : BigDecimal {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)
    var totalWorkAccountLevy = BigDecimal.ZERO

    for (cuData in line.AEPRateableCUData) {
      var data = new AEPPartnershipPlanDiscountCostData(start, end, line.getPreferredCoverageCurrency(), RateCache, cuData.FixedId)
      var existingCost = data.getExistingCost(line)
      var effectiveDate = PolicyLine.EffectiveDate
      data.RateBook = RateBook
      data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
      data.RoundingLevel = 2
      if (line.ContractPlanType == AEPContractPlanType_ACC.TC_PARTNERSHIP_DISCOUNT) {
        data.ChargePattern = ChargePattern.TC_AEP_PPD
      }

      // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
      // into the routine so it can do rate capping.
      var priorLine = line.BasedOn
      while (priorLine != null and priorLine.Branch.PolicyTerm == line.Branch.PolicyTerm) {
        priorLine = priorLine.BasedOn
      }

      var taxableAmount = CostDataMap.values().first().firstWhere(\elt -> elt typeis AEPWorkAccountLevyCostData and elt.CUItemFixedID == cuData.FixedId).ActualAmount
      var discount = taxableAmount * getAuditDiscount(line.Branch.LevyYear_ACC, line.Branch.Policy.Account.ACCID_ACC)
      var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
          {TC_POLICYLINE->PolicyLine,
              TC_TAXABLEBASIS->taxableAmount.add(discount),
              TC_LEVYRATEEFFECTIVEDATE->effectiveDate,
              TC_AEPCLAIMSMANAGEMENTPERIOD->getAEPClaimManagementPeriodCode(line.ClaimManagementPeriod),
              TC_CLASSIFICATIONUNIT->cuData.CUCode}

      RateBook.executeCalcRoutine(PARTNERSHIP_DISCOUNT_PROGRAMME_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
          :paramSet = rateRoutineParameterMap)

      data.copyStandardColumnsToActualColumns()
      preventProRataOfLevy(data)
      if (data.Overridable) {
        if (existingCost.OverrideReason != "Below Premium Threshold") {
          data.copyOverridesFromCost(existingCost)
        }
        computeValuesFromCostOverrides(existingCost, data, false)
      }

      // call addCost() to add the new cost to the collection
      addCost(data)

      totalWorkAccountLevy += data.ActualAmount
    }

    return totalWorkAccountLevy
  }

  private function calculateAuditDiscountLevy(line : AEPLine_ACC, totalWorkAccountLevy : BigDecimal) : BigDecimal {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)

    var data = new AEPAuditDiscountLevyCostData(start, end, line.getPreferredCoverageCurrency(), RateCache)
    var existingCost = data.getExistingCost(line)

    data.Basis = totalWorkAccountLevy
    data.StandardBaseRate = getAuditDiscount(line.Branch.LevyYear_ACC, line.Branch.Policy.Account.ACCID_ACC)
    data.StandardAdjRate = data.StandardBaseRate
    data.StandardTermAmount = data.Basis * data.StandardBaseRate
    data.StandardAmount = data.StandardTermAmount
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.RoundingLevel = 2

    if (line.ContractPlanType == AEPContractPlanType_ACC.TC_PARTNERSHIP_DISCOUNT) {
      data.ChargePattern = ChargePattern.TC_AEP_PPD
    }

    data.copyStandardColumnsToActualColumns()
    preventProRataOfLevy(data)
    if (data.Overridable) {
      if (existingCost.OverrideReason != "Below Premium Threshold") {
        data.copyOverridesFromCost(existingCost)
      }
      computeValuesFromCostOverrides(existingCost, data, false)
    }

    // call addCost() to add the new cost to the collection
    addCost(data)

    totalWorkAccountLevy += data.ActualAmount

    if (line.ContractPlanType == AEPContractPlanType_ACC.TC_FULL_SELF_COVER) {
      calculateAuditNegatedLevy(line, data)
    }

    return totalWorkAccountLevy
  }

  private function calculateAuditNegatedLevy(line : AEPLine_ACC, costData : AEPCostData) {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)

    var data = new AEPAuditNegatedLevyCostData(start, end, line.getPreferredCoverageCurrency(), RateCache)
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.RoundingLevel = 2
    data.StandardAmount = costData.ActualAmount.negate()
    data.StandardTermAmount = costData.ActualTermAmount.negate()

    data.copyStandardColumnsToActualColumns()
    data.ActualAdjRate = costData.StandardBaseRate
    data.ActualBaseRate = costData.StandardBaseRate
    preventProRataOfLevy(data)

    // call addCost() to add the new cost to the collection
    addCost(data)
  }

  private function calculateBulkHealthCostLevy(line : AEPLine_ACC, totalWorkAccountLevy : BigDecimal) : BigDecimal {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)

    var data = new AEPBulkFundedHealthCostData(start, end, line.getPreferredCoverageCurrency(), RateCache)
    var existingCost = data.getExistingCost(line)
    var effectiveDate = PolicyLine.EffectiveDate

    data.Basis = totalWorkAccountLevy
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.RoundingLevel = 2
    data.ChargePattern = ChargePattern.TC_AEP_BFHC

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE->PolicyLine,
            TC_TAXABLEBASIS->totalWorkAccountLevy,
            TC_LEVYRATEEFFECTIVEDATE->effectiveDate}

    RateBook.executeCalcRoutine(BULK_FUNDED_HEALTH_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    preventProRataOfLevy(data)
    if (data.Overridable) {
      data.copyOverridesFromCost(existingCost)
      computeValuesFromCostOverrides(existingCost, data, false)
    }

    // call addCost() to add the new cost to the collection
    addCost(data)

    totalWorkAccountLevy += data.StandardAmount
    return totalWorkAccountLevy
  }

  private function calculateHighClaimsCost(line : AEPLine_ACC, totalWorkAccountLevy : BigDecimal) : BigDecimal {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)

    var data = new AEPHighCostClaimsCoverCostData(start, end, line.getPreferredCoverageCurrency(), RateCache)
    var existingCost = data.getExistingCost(line)
    var effectiveDate = PolicyLine.EffectiveDate

    data.Basis = totalWorkAccountLevy
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.RoundingLevel = 2
    data.ChargePattern = ChargePattern.TC_AEP_HCCC

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE->PolicyLine,
            TC_TAXABLEBASIS->totalWorkAccountLevy,
            TC_LEVYRATEEFFECTIVEDATE->effectiveDate,
            TC_AEPHIGHCOSTCLAIMSSTATUSCODE->Integer.parseInt(line.HighCostClaimsCover.Code)}

    RateBook.executeCalcRoutine(HIGH_CLAIMS_COST_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    preventProRataOfLevy(data)
    if (data.Overridable) {
      data.copyOverridesFromCost(existingCost)
      computeValuesFromCostOverrides(existingCost, data, false)
    }

    // call addCost() to add the new cost to the collection
    addCost(data)

    totalWorkAccountLevy += data.ActualAmount
    return totalWorkAccountLevy
  }

  private function calculateStopLossLimit(line : AEPLine_ACC, totalWorkAccountLevy : BigDecimal, discountedWAL : BigDecimal) {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)

    var data = new AEPStopLossLevyCostData(start, end, line.getPreferredCoverageCurrency(), RateCache)
    var existingCost = data.getExistingCost(line)
    var effectiveDate = PolicyLine.EffectiveDate

    data.Basis = totalWorkAccountLevy
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.RoundingLevel = 2
    data.ChargePattern = ChargePattern.TC_AEP_SLL

    var lowerStopLossLimit : BigDecimal = line.StopLossPercentage
    var upperStopLossLimit = lowerStopLossLimit
    if (((line.StopLossPercentage != null) ? line.StopLossPercentage : 0) % 10 != 0) {
      lowerStopLossLimit = line.StopLossPercentage - (line.StopLossPercentage % 10)
      upperStopLossLimit = lowerStopLossLimit + 10
    }

    var claimsManagementPeriod = 0
    if (line.ContractPlanType == AEPContractPlanType_ACC.TC_PARTNERSHIP_DISCOUNT) {
      claimsManagementPeriod = getAEPClaimManagementPeriodCode(line.ClaimManagementPeriod)
    }
    var hccCode = 0
    if (line.ContractPlanType == AEPContractPlanType_ACC.TC_FULL_SELF_COVER) {
      hccCode = Integer.parseInt(line.HighCostClaimsCover.Code?:"5")
    }

    var stopLossLimitResults = new AEPStopLossResults_ACC()
    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE->PolicyLine,
            TC_TAXABLEBASIS->totalWorkAccountLevy,
            TC_LEVYRATEEFFECTIVEDATE->effectiveDate,
            TC_AEPSTOPLOSSLIMIT->BigDecimal.valueOf(line.StopLossPercentage),
            TC_AEPPLANTYPE->line.ContractPlanType == AEPContractPlanType_ACC.TC_PARTNERSHIP_DISCOUNT ? 1 : 2,
            TC_AEPCLAIMSMANAGEMENTPERIOD->claimsManagementPeriod,
            TC_AEPHIGHCOSTCLAIMSSTATUSCODE->hccCode,
            TC_AEPSTOPLOSSLOWERLIMIT->lowerStopLossLimit,
            TC_AEPSTOPLOSSUPPERLIMIT->upperStopLossLimit,
            TC_AEPLOSSBAND->BigDecimal.ZERO,
            TC_DISCOUNTEDTAXABLEBASIS->discountedWAL,
            TC_AEPSTOPLOSSLIMITRESULTS->stopLossLimitResults
        }

    RateBook.executeCalcRoutine(STOP_LOSS_LIMIT_COST_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    preventProRataOfLevy(data)
    if (data.Overridable) {
      data.copyOverridesFromCost(existingCost)
      computeValuesFromCostOverrides(existingCost, data, false)
    }

    // call addCost() to add the new cost to the collection
    addCost(data)

    // DE967 - Copy Stop Loss Limit data to the cost
    var populatedCost = data.getPopulatedCost(line)
    if (populatedCost != null) {
      populatedCost.copyStopLossDataToAEPStopLossLevyCost(stopLossLimitResults)
    }

    stopLossLimitResults.remove()
  }

  private function calculateAdminFeeCostLevy(line : AEPLine_ACC, totalWorkAccountLevy : BigDecimal) {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)

    var data = new AEPAdministrationFeeCostData(start, end, line.getPreferredCoverageCurrency(), RateCache)
    var existingCost = data.getExistingCost(line)
    var effectiveDate = PolicyLine.EffectiveDate

    data.Basis = totalWorkAccountLevy
    data.ChargePattern = ChargePattern.TC_AEP_ADMINFEE
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.RoundingLevel = 2

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE->PolicyLine,
            TC_TAXABLEBASIS->totalWorkAccountLevy,
            TC_LEVYRATEEFFECTIVEDATE->effectiveDate}

    RateBook.executeCalcRoutine(ADMINISTRATION_FEE_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    preventProRataOfLevy(data)
    if (data.Overridable) {
      data.copyOverridesFromCost(existingCost)
      computeValuesFromCostOverrides(existingCost, data, false)
    }

    // call addCost() to add the new cost to the collection
    addCost(data)
  }

  private function calculatePrimaryHealthCostLevy(line : AEPLine_ACC, totalWorkAccountLevy : BigDecimal) {
    var start = line.SliceDate
    var end = getNextSliceDateAfter(start)

    var data = new AEPPrimaryHealthCostData(start, end, line.getPreferredCoverageCurrency(), RateCache)
    var existingCost = data.getExistingCost(line)
    var effectiveDate = PolicyLine.EffectiveDate

    data.Basis = totalWorkAccountLevy
    data.ChargePattern = ChargePattern.TC_AEP_ADMINFEE
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.RoundingLevel = 2

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE->PolicyLine,
            TC_TAXABLEBASIS->totalWorkAccountLevy,
            TC_LEVYRATEEFFECTIVEDATE->effectiveDate}

    RateBook.executeCalcRoutine(PRIMARY_HEALTH_COST_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    preventProRataOfLevy(data)
    if (data.Overridable) {
      data.copyOverridesFromCost(existingCost)
      computeValuesFromCostOverrides(existingCost, data, false)
    }

    // call addCost() to add the new cost to the collection
    addCost(data)
  }

  // Used by the extractCostDatasFromExistingCosts method.  Must be implemented if that method is going to be called
  override protected function createCostDataForCost(c : Cost) : CostData {
    var cd : CostData

    switch (typeof c) {
      case AEPWorkAccountLevyCost_ACC:
        cd = new AEPWorkAccountLevyCostData(c, RateCache)
        break
      case AEPAuditDiscountLevyCost_ACC:
        cd = new AEPAuditDiscountLevyCostData(c, RateCache)
        break
      case AEPWorkingSaferLevyCost_ACC:
        cd = new AEPWorkingSaferLevyCostData(c, RateCache)
        break
      case AEPAdministrationFeeCost_ACC:
        cd = new AEPAdministrationFeeCostData(c, RateCache)
        break
      case AEPBulkFundedHealthCost_ACC:
        cd = new AEPBulkFundedHealthCostData(c, RateCache)
        break
      case AEPStopLossLevyCost_ACC:
        cd = new AEPStopLossLevyCostData(c, RateCache)
        break
      case AEPResidualWorkAccountLevyCost_ACC:
        cd = new AEPResidualWorkAccountLevyCostData(c, RateCache)
        break
      case AEPHighCostClaimsCoverCost_ACC:
        cd = new AEPHighCostClaimsCoverCostData(c, RateCache)
        break
      case AEPPartnershipPlanDiscountCost_ACC:
        cd = new AEPPartnershipPlanDiscountCostData(c, RateCache)
        break
      case AEPTaxCost_ACC:
        cd = new AEPTaxCostData(c, RateCache)
        break
      default:
        throw "Unexpected cost type ${c.DisplayName}"
    }
    return cd
  }

  /******
   * This default version of this method will return all of the Costs on a policy for the slice's effective date.  If some of the
   * costs on a policy are created as part of the "rate window" portion of the rating algorithm (that is, they are created at the
   * end for the entire period rather than created as part of rating each slice in time), then these costs should be excluded
   * from what is returned by this method.  Override this method to return only the types of costs that would be created during the
   * rateSlice portion of the algorithm in that case.
   ******/
  override protected function existingSliceModeCosts() : Iterable<Cost> {
    return PolicyLine.Costs
  }

  protected property get RoundingLevel() : int {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingLevel
  }

  protected property get RoundingMode() : RoundingMode {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingMode
  }

  override property get NumDaysInCoverageRatedTerm() : int {
    var prorater = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    var endDate = Plugins.get(IPolicyTermPlugin).calculatePeriodEnd(Branch.StartOfRatedTerm, Branch.Policy.Product.DefaultTermType, Branch)
    return prorater.financialDaysBetween(endDate, Branch.StartOfRatedTerm)
  }

  protected override function createDeductibleTaxCostData() : CostData<Cost, PolicyLine> {
    return new AEPTaxCostData(Branch.PeriodStart, Branch.PeriodEnd, TaxRatingCurrency, RateCache, ChargePattern.TC_GST)
  }

  protected override function createNonDeductibleTaxCostData() : CostData<Cost, PolicyLine> {
    return new AEPTaxCostData(Branch.PeriodStart, Branch.PeriodEnd, TaxRatingCurrency, RateCache)
  }

  override function createModifierCostData(effDate : Date, expDate : Date, coveredItemID : Key, modifier : Key, modifierDate : Key) : CostDataWithOverrideSupport<Cost, PolicyLine> {
    return null
  }

  override function createModifierCostData(effDate : Date, expDate : Date, coveredItemID : Key, modifier : Key) : CostDataWithOverrideSupport<Cost, PolicyLine> {
    return null
  }

  override function getProvisionalModifierCosts() : Cost[] {
    return null
  }

  /**
   * Update cost with migration values. This is executed for migration transactions
   */
  protected override function updateDataMigrationCosts(lineVersion : AEPLine_ACC) {
    if (_LOG.DebugEnabled) {
      _LOG.debug(_LOG_TAG + "updateDataMigrationCosts enter")
    }
    // get migrated costs and apply
    for (migrationAEPCost in lineVersion.MigrationAEPCosts) {
      createCostData(lineVersion, migrationAEPCost)
      lineVersion.removeFromMigrationAEPCosts(migrationAEPCost)
    }
    if (_LOG.DebugEnabled) {
      _LOG.debug(_LOG_TAG + "updateDataMigrationCosts exit")
    }
  }

  private function createCostData(lineVersion : AEPLine_ACC, migrationAEPCost : MigrationAEPCostInfo_ACC) {
    var policyLine = lineVersion.getSlice(Branch.PeriodStart)

    // find cost of this type
    var cost = policyLine.AEPCosts?.firstWhere(\c -> c.Subtype == migrationAEPCost.AEPCostSubtype and
        ((c.Subtype != typekey.AEPCost_ACC.TC_AEPWORKACCOUNTLEVYCOST_ACC and
            c.Subtype != typekey.AEPCost_ACC.TC_AEPRESIDUALWORKACCOUNTLEVYCOST_ACC and
            c.Subtype != typekey.AEPCost_ACC.TC_AEPPARTNERSHIPPLANDISCOUNTCOST_ACC and
            c.Subtype != AEPCost_ACC.TC_AEPWORKACCOUNTDISCOUNTCOST_ACC) or
            c.AEPRateableCUData?.CUCode == migrationAEPCost.CUCode))

    // just create a new one
    if (cost == null) {
      switch (migrationAEPCost.AEPCostSubtype) {
        case typekey.AEPCost_ACC.TC_AEPWORKACCOUNTLEVYCOST_ACC:
          cost = new AEPWorkAccountLevyCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPAUDITDISCOUNTLEVYCOST_ACC:
          cost = new AEPAuditDiscountLevyCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPWORKINGSAFERLEVYCOST_ACC:
          cost = new AEPWorkingSaferLevyCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPADMINISTRATIONFEECOST_ACC:
          cost = new AEPAdministrationFeeCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPBULKFUNDEDHEALTHCOST_ACC:
          cost = new AEPBulkFundedHealthCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPSTOPLOSSLEVYCOST_ACC:
          cost = new AEPStopLossLevyCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPRESIDUALWORKACCOUNTLEVYCOST_ACC:
          cost = new AEPResidualWorkAccountLevyCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPHIGHCOSTCLAIMSCOVERCOST_ACC:
          cost = new AEPHighCostClaimsCoverCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPPARTNERSHIPPLANDISCOUNTCOST_ACC:
          cost = new AEPPartnershipPlanDiscountCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPPRIMARYHEALTHCOST_ACC:
          cost = new AEPPrimaryHealthCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPTAXCOST_ACC:
          cost = new AEPTaxCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPAUDITNEGATEDLEVYCOST_ACC:
          cost = new AEPAuditNegatedLevyCost_ACC(Branch)
          break
        case typekey.AEPCost_ACC.TC_AEPWORKACCOUNTDISCOUNTCOST_ACC:
          cost = new AEPWorkAccountDiscountCost_ACC(Branch)
          break
        default:
          throw "Unexpected cost type ${migrationAEPCost.AEPCostSubtype}"
      }
    }
    cost.setAEPLine(lineVersion)
    if (migrationAEPCost.CUCode != null) {
      cost.AEPRateableCUData = lineVersion.AEPRateableCUData?.firstWhere(\data -> data.CUCode == migrationAEPCost.CUCode)
    }
    if (cost typeis AEPStopLossLevyCost_ACC) {
      cost.CalcStopLossLimit = migrationAEPCost.CalcStopLossLimit
      cost.StopLossLimitWorkAccLevyRatio = migrationAEPCost.StopLossLimitWorkAccLevyRatio
    }

    // set migrated values
    cost.setActualAmountBilling(migrationAEPCost.ActualTermAmount)
    cost.setActualTermAmountBilling(migrationAEPCost.ActualTermAmount)
    cost.setStandardAmountBilling(migrationAEPCost.ActualTermAmount)
    cost.setStandardTermAmountBilling(migrationAEPCost.ActualTermAmount)

    cost.setActualAmount(migrationAEPCost.ActualTermAmount)
    cost.setActualTermAmount(migrationAEPCost.ActualTermAmount)
    cost.setStandardAmount(migrationAEPCost.ActualTermAmount)
    cost.setStandardTermAmount(migrationAEPCost.ActualTermAmount)

    cost.setActualAdjRate(migrationAEPCost.ActualAdjRate)
    cost.setActualBaseRate(migrationAEPCost.ActualAdjRate)

    cost.setChargePattern(migrationAEPCost.ChargePattern)
    cost.setBasis(migrationAEPCost.Basis)
    cost.setRoundingLevel(migrationAEPCost.RoundingLevel)
    cost.setRateAmountType(migrationAEPCost.RateAmountType)
    cost.setNumDaysInRatedTerm(migrationAEPCost.NumDaysInRatedTerm)
    cost.setEffectiveDate(Branch.PeriodStart)
    cost.setExpirationDate(Branch.PeriodEnd)
    cost.setOverrideSource(OverrideSourceType.TC_RENEWALCAP)

    // cost data
    // this is just slightly different than createCostDataForCost
    var costData : AEPCostData
    switch (typeof cost) {
      case AEPWorkAccountLevyCost_ACC:
        costData = new AEPWorkAccountLevyCostData(cost)
        break
      case AEPAuditDiscountLevyCost_ACC:
        costData = new AEPAuditDiscountLevyCostData(cost)
        break
      case AEPWorkingSaferLevyCost_ACC:
        costData = new AEPWorkingSaferLevyCostData(cost)
        break
      case AEPAdministrationFeeCost_ACC:
        costData = new AEPAdministrationFeeCostData(cost)
        break
      case AEPBulkFundedHealthCost_ACC:
        costData = new AEPBulkFundedHealthCostData(cost)
        break
      case AEPStopLossLevyCost_ACC:
        costData = new AEPStopLossLevyCostData(cost)
        break
      case AEPResidualWorkAccountLevyCost_ACC:
        costData = new AEPResidualWorkAccountLevyCostData(cost)
        break
      case AEPHighCostClaimsCoverCost_ACC:
        costData = new AEPHighCostClaimsCoverCostData(cost)
        break
      case AEPPartnershipPlanDiscountCost_ACC:
        costData = new AEPPartnershipPlanDiscountCostData(cost)
        break
      case AEPPrimaryHealthCost_ACC:
        costData = new AEPPrimaryHealthCostData(cost)
        break
      case AEPTaxCost_ACC:
        costData = new AEPTaxCostData(cost)
        break
      case AEPAuditNegatedLevyCost_ACC:
        costData = new AEPAuditNegatedLevyCostData(cost)
        break
      case AEPWorkAccountDiscountCost_ACC:
        costData = new AEPWorkAccountDiscountCostData(cost)
        break
      default:
        throw "Unexpected cost type ${cost.DisplayName}"
    }

    // add to cost data map
    var results = this.CostDataMap
    var costDataList = results.get(lineVersion)
    if (costDataList == null) {
      costDataList = {}
    }
    costDataList.add(costData)
    results.put(lineVersion, costDataList)
  }

  /**
   * @param       typekey.AEPClaimManagePeriod_ACC to be mapped to Actuaries rate table code
   * @throws      IllegalArgumentException when passed the null or a typecode which is not implemented in this function
   * @return      numeric identifier of Claim Management Period as of how it is defined in rate tables
   * */
  private function getAEPClaimManagementPeriodCode(typekey: AEPClaimManagePeriod_ACC): Integer {
    switch (typekey) {
      case AEPClaimManagePeriod_ACC.TC_12_MONTHS : return 1
      case AEPClaimManagePeriod_ACC.TC_24_MONTHS : return 2
      case AEPClaimManagePeriod_ACC.TC_36_MONTHS : return 3
      case AEPClaimManagePeriod_ACC.TC_48_MONTHS : return 4
      default: throw new IllegalArgumentException("Unexpected argument: Typecode to Code mapping is not implemented for [${typekey.DisplayName}] Claim Management Period's option")
    }
  }


}
