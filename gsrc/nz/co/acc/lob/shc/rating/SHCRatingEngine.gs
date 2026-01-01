package nz.co.acc.lob.shc.rating

uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.Key
uses gw.rating.CalcRoutineExecutionException
uses gw.rating.CostData
uses gw.rating.CostDataWithOverrideSupport
uses gw.rating.RateFlowLogger

uses java.math.BigInteger
uses java.util.Date
uses java.math.BigDecimal

uses java.lang.Iterable

uses gw.financials.Prorater
uses gw.plugin.Plugins
uses gw.plugin.policyperiod.IPolicyTermPlugin
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.Pair
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.common.rating.function.NextTermModifierOverrideHandler
uses nz.co.acc.lob.util.ProRationUtil_ACC
uses nz.co.acc.migration.rating.AbstractMigrationRatingEngine_ACC
uses nz.co.acc.lob.common.rating.function.CancelProrataFactor

uses typekey.*
uses typekey.Job

class SHCRatingEngine extends AbstractMigrationRatingEngine_ACC<CWPSLine> {

  static var _LOG = StructuredLogger.CONFIG.withClass(SHCRatingEngine)
  static var _LOG_TAG = "${AbstractMigrationRatingEngine_ACC.Type.RelativeName} - "

  var _baseRatingDate: Date
  var _uwCompanyRateFactor: BigDecimal

  construct(line: CWPSLine) {
    this(line, RateBookStatus.TC_ACTIVE)
  }

  construct(line: CWPSLine, minimumRatingLevel: RateBookStatus) {
    super(line, minimumRatingLevel)
    _baseRatingDate = line.Branch.RateAsOfDate
    _uwCompanyRateFactor = line.Branch.getUWCompanyRateFactor(_baseRatingDate, _jurisdiction)
    _minimumRatingLevel = minimumRatingLevel
  }

  override protected function rateSlice(lineVersion: CWPSLine) {
    assertSliceMode(lineVersion)

    if (lineVersion.Branch.isCanceledSlice()) {
      // Do nothing if this is a canceled slice
    } else {
      // Implementation moved over to rateWindow
    }
  }

  private function rateWorkAccountLevyCosts(lineVersion : CWPSLine) {
    var cov = lineVersion.CWPSCovs.first()
    if (cov != null) {
      // create the CU items
      cov.computeWorkAccountLevyCUCosts()
    }
  }

  private function rateResidualWorkAccountLevyCosts(lineVersion : CWPSLine) {
    var cov = lineVersion.CWPSCovs.first()
    if (cov != null) {
      // create the CU items
      cov.computeResidualWorkAccountLevyCUCosts()
    }
  }


  private function rateWorkAccountLevy(lineVersion : CWPSLine, proRataFactor:BigDecimal) {
    var totalLevyAmount = BigDecimal.ZERO
    var cov = lineVersion.CWPSCovs.first()

    if (cov == null ) {
      var msg = "Failed to rate the Work Account Levy."
      throw new IllegalArgumentException(msg)
    }

    // iterate through CU Items and rate each one
    for (cuCode in cov.WorkAccountLevyCosts.where(\elt -> elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)) {

      // create an empty CostData -- amounts will be filled in by the rate routine
      var start = cov.SliceDate
      var end = getNextSliceDateAfter(start)
      var data = new CWPSWorkAccountLevyCostData(start, end, cov.getPreferredCoverageCurrency(), RateCache, cov.FixedId, cuCode.FixedId)
      var existingCost = data.getExistingCost(lineVersion)
      var effectiveDate = lineVersion.EffectiveDate
      data.RateBook = RateBook
      data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
      data.ChargePattern = ChargePattern.TC_WAL
      data.RoundingLevel = 2

      var taxableCost = cuCode.LeLessSheOnCPX_ACC.Amount?:BigDecimal.ZERO

      // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
      // into the routine so it can do rate capping.
      var priorCov = cov.BasedOn
      while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
        priorCov = priorCov.BasedOn
      }

      var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
          {CalcRoutineParamName.TC_POLICYLINE -> PolicyLine,
           CalcRoutineParamName.TC_TAXABLEBASIS -> taxableCost,
           CalcRoutineParamName.TC_CLASSIFICATIONUNIT -> cuCode.Code,
           CalcRoutineParamName.TC_LEVYRATEEFFECTIVEDATE -> effectiveDate,
           CalcRoutineParamName.TC_ER_OR_NCD -> BigDecimal.ZERO,
           CalcRoutineParamName.TC_WSD_OR_WSMP -> BigDecimal.ZERO}

      RateBook.executeCalcRoutine(WORK_ACCOUNT_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
          :paramSet = rateRoutineParameterMap)

      data.StandardAmount = data.StandardTermAmount * proRataFactor
      data.copyStandardColumnsToActualColumns()
      if(data.Overridable) {
        performOverride(existingCost, data)
      }

      // call addCost() to add the new cost to the collection
      addCost(data)

      if(ERStatus == ERStatus_ACC.TC_ER_MODIFIER_PENDING or
          ERStatus == ERStatus_ACC.TC_NEXT_TERM_ER_MODIFIER_PENDING or
          checkForPremiumThresholdOverried()) {
        totalLevyAmount += data.StandardAmount
      } else {
        totalLevyAmount += data.ActualAmount
      }
    }

    var effectDatesList = createPolicyEffectiveDates()
    totalLevyAmount += rateERModifier(totalLevyAmount, lineVersion, lineVersion.SHCLineModifiers,
        Funxion.buildProcessor(new CancelProrataFactor()).process(proRataFactor))
    rateDiscountAppliedModifiers(totalLevyAmount, lineVersion, lineVersion.SHCLineModifiers, effectDatesList)
  }

  private function rateResidualWorkAccountLevy(lineVersion : CWPSLine, proRataFactor:BigDecimal) {
    var cov = lineVersion.CWPSCovs.first()

    if (cov == null ) {
      throw new IllegalArgumentException("Failed to rate the Residual Work Account Levy.")
    }

    // iterate through CU Items and rate each one
    for (costItem in cov.ResidualWorkAccountLevyCosts) {
      // create an empty CostData -- amounts will be filled in by the rate routine
      var start = cov.SliceDate
      var end = getNextSliceDateAfter(start)
      var data = new CWPSResidualWorkAccountLevyCostData(start, end, cov.getPreferredCoverageCurrency(), RateCache, cov.FixedId, costItem.FixedId)
      var existingCost = data.getExistingCost(lineVersion)
      var effectiveDate = PolicyLine.EffectiveDate
      data.RateBook = RateBook
      data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
      data.ChargePattern = ChargePattern.TC_WARP
      data.RoundingLevel      = 2

      var taxableCost = BigDecimal.ZERO
      if (Audit) {
        taxableCost = costItem.LiableEarnings.Amount
      } else {
        taxableCost = costItem.AdjustedLiableEarnings.Amount
      }

      // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
      // into the routine so it can do rate capping.
      var priorCov = cov.BasedOn
      while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
        priorCov = priorCov.BasedOn
      }

      var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
          {CalcRoutineParamName.TC_POLICYLINE      -> PolicyLine,
              CalcRoutineParamName.TC_TAXABLEBASIS -> taxableCost,
              CalcRoutineParamName.TC_CLASSIFICATIONUNIT -> costItem.Code,
              CalcRoutineParamName.TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate}

      RateBook.executeCalcRoutine(WORK_RESIDUAL_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
          :paramSet = rateRoutineParameterMap)

      data.StandardAmount = data.StandardTermAmount * proRataFactor
      data.copyStandardColumnsToActualColumns()
      if(data.Overridable) {
        performOverride(existingCost, data)
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
  }

  private function rateEarnersLevy(lineVersion : CWPSLine, proRataFactor:BigDecimal) {
    var cov = lineVersion.CWPSCovs.first()

    if (cov == null ) {
      throw new IllegalArgumentException("Failed to rate Earners Levy.")
    }

    var start = cov.SliceDate
    var end = getNextSliceDateAfter(start)
    var data = new CWPSEarnersLevyCostData(start, end, cov.getPreferredCoverageCurrency(), RateCache, cov.FixedId)
    var existingCost = data.getExistingCost(lineVersion)
    var effectiveDate = PolicyLine.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern      = ChargePattern.TC_EL
    data.RoundingLevel      = 2

    var taxableCost = BigDecimal.ZERO
    if (Audit) {
      taxableCost = PolicyLine.PolicyShareholders.sum(\elt -> elt.sumAuditAdjustedLELessCpx().Amount)
    } else {
      taxableCost = PolicyLine.PolicyShareholders.sum(\elt -> elt.sumAdjustedLELessCpx().Amount)
    }

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cov.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {CalcRoutineParamName.TC_POLICYLINE      -> PolicyLine,
            CalcRoutineParamName.TC_TAXABLEBASIS -> taxableCost,
            CalcRoutineParamName.TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate,
            CalcRoutineParamName.TC_CPXINFOCOV        -> null}

    // Earners Levy
    RateBook.executeCalcRoutine(EARNERS_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.StandardAmount = data.StandardTermAmount * proRataFactor
    data.copyStandardColumnsToActualColumns()
    if(data.Overridable) {
      performOverride(existingCost, data)
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

  private function rateResidualEarnersLevy(lineVersion : CWPSLine, proRataFactor:BigDecimal) {
    var cov = lineVersion.CWPSCovs.first()

    if (cov == null ) {
      throw new IllegalArgumentException("Failed to rate Earners Residual Levy.")
    }

    // create an empty CostData -- amounts will be filled in by the rate routine
    var start = cov.SliceDate
    var end = getNextSliceDateAfter(start)
    var data = new CWPSResidualEarnersLevyCostData(start, end, cov.getPreferredCoverageCurrency(), RateCache, cov.FixedId)
    var existingCost = data.getExistingCost(lineVersion)
    var effectiveDate = PolicyLine.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern      = ChargePattern.TC_ERP
    data.RoundingLevel      = 2

    var taxableCost = BigDecimal.ZERO
    if (Audit) {
      taxableCost = PolicyLine.PolicyShareholders.sum(\ c-> c.sumLiableEarnings())
    } else {
      taxableCost = PolicyLine.PolicyShareholders.sum(\ c-> c.sumAdjustedLiableEarnings())
    }

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cov.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {CalcRoutineParamName.TC_POLICYLINE      -> PolicyLine,
            CalcRoutineParamName.TC_TAXABLEBASIS -> taxableCost,
            CalcRoutineParamName.TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate}

    // Earners Residual Levy
    RateBook.executeCalcRoutine(EARNERS_RESIDUAL_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.StandardAmount = data.StandardTermAmount * proRataFactor
    data.copyStandardColumnsToActualColumns()
    if(data.Overridable) {
      performOverride(existingCost, data)
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

  private function rateWorkingSaferLevy(lineVersion : CWPSLine, proRataFactor:BigDecimal) {
    var cov = lineVersion.CWPSCovs.first()

    if (cov == null ) {
      throw new IllegalArgumentException("Failed to rate Working Safer Levy.")
    }

    // create an empty CostData -- amounts will be filled in by the rate routine
    var start = cov.SliceDate
    var end = getNextSliceDateAfter(start)
    var data = new CWPSWorkingSaferLevyCostData(start, end, cov.getPreferredCoverageCurrency(), RateCache, cov.FixedId)
    var existingCost = data.getExistingCost(lineVersion)
    var effectiveDate = PolicyLine.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern = ChargePattern.TC_WSL
    data.RoundingLevel = 2

    var taxableCost = BigDecimal.ZERO
    if (Audit) {
      if(lineVersion.AssociatedPolicyPeriod.LevyYear_ACC >= ScriptParameters.WorkingSaferStartLevyYear_ACC){
        taxableCost = PolicyLine.PolicyShareholders.sum(\ c-> c.sumAuditAdjustedLELessCpx())
      } else {
        taxableCost = PolicyLine.PolicyShareholders.sum(\ c-> c.sumLiableEarnings())
      }
    } else {
      taxableCost = PolicyLine.PolicyShareholders.sum(\ c-> c.sumLiableEarningsLessCPX())
    }

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cov.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {CalcRoutineParamName.TC_POLICYLINE      -> PolicyLine,
            CalcRoutineParamName.TC_TAXABLEBASIS -> taxableCost,
            CalcRoutineParamName.TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate}

    // Working Safer Levy
    RateBook.executeCalcRoutine("working_safer_levy_rr", :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.StandardAmount = data.StandardTermAmount * proRataFactor
    data.copyStandardColumnsToActualColumns()
    if(data.Overridable) {
      performOverride(existingCost, data)
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

  /******
   * This default version of this method will not create any costs for the entire period.  Instead, it assumes that all costs are created
   * as part of calculating the pro rata premium for each slice of effective time.  If a policy does need to create Costs for the entire
   * period (such as a cancellation short rate penalty or a non-linear premium discount), then this method should be overridden to implement
   * that logic.
   ******/
  override protected function rateWindow(line: CWPSLine) {
    var logMsg = "Rating across policy term..."
    if (_logger.DebugEnabled) {
      _logger.debug(logMsg)
    }

    var period = line.getAssociatedPolicyPeriod()

    Funxion.buildExecutor(new NextTermModifierOverrideHandler(period)).execute(OverrideHandler)

    // This determines what set of BIC codes to use: BICCodes for Submission and AuditedBICCodes for Audit
    this.Audit = line.JobType == typekey.Job.TC_AUDIT
    // Rate line-level coverages per vehicle
    rateWorkAccountLevyCosts(line)
    if (Audit and DateUtil_ACC.isDatePriorACCWorkResidualLevyEndDate(line.getAssociatedPolicyPeriod().PeriodEnd)) {
      rateResidualWorkAccountLevyCosts(line)
    }

    line.CWPSCovs.first().ProRataFactor = ProRationUtil_ACC.getProRataFactor(line.AssociatedPolicyPeriod)
    rateWorkAccountLevy(line, line.CWPSCovs.first().ProRataFactor)
    // Don't rate for the Submission
    if (Audit) {
      if (DateUtil_ACC.isDatePriorACCWorkResidualLevyEndDate(line.getAssociatedPolicyPeriod().PeriodEnd)) {
        rateResidualWorkAccountLevy(line, line.CWPSCovs.first().ProRataFactor)
      }
      rateEarnersLevy(line, line.CWPSCovs.first().ProRataFactor)
      if (DateUtil_ACC.isDatePriorACCEarnersResidualLevyEndDate(line.getAssociatedPolicyPeriod().PeriodEnd)) {
        rateResidualEarnersLevy(line, line.CWPSCovs.first().ProRataFactor)
      }

      rateWorkingSaferLevy(line, line.CWPSCovs.first().ProRataFactor)
    }

    if (!Audit){
      calculateGST()
    } else {
      // DE2667 - Apply GST calculation correctly
      var taxDeductibleSubTotal = costDataSum(true)
      var taxNonDeductibleSubTotal = costDataSum(false)
      calculateGST(taxDeductibleSubTotal, true)
      calculateGST(taxNonDeductibleSubTotal, false)
    }

    clearOverrideAndApplyToActual()

    if (_logger.DebugEnabled) {
      _logger.debug(logMsg + " done")
    }
  }

  /**
   * DE2667 apply GST calculation logic
   * @param taxDeductible
   * @return
   */
  function costDataSum(taxDeductible : boolean) : BigDecimal {
    var useStandardAmount = false
    var subTotal = BigDecimal.ZERO
    if (PolicyLine.JobType == typekey.Job.TC_AUDIT and
        ERStatus == ERStatus_ACC.TC_ER_MODIFIER_PENDING) {
      useStandardAmount = true
    } else {
      if (checkForERModifierOverride() or
          checkForPremiumThresholdOverried()) {
        useStandardAmount = true
      } else {
        useStandardAmount = false
      }
    }
    if (useStandardAmount) {
      if (taxDeductible) {
        subTotal = CostDatas.where(\c -> c.ChargePattern == ChargePattern.TC_WAL || c.ChargePattern == ChargePattern.TC_WARP || c.ChargePattern == ChargePattern.TC_WSL).sum(\c -> c.StandardAmountBilling.Amount)
      } else {
        subTotal = CostDatas.where(\c -> c.ChargePattern == ChargePattern.TC_EL || c.ChargePattern == ChargePattern.TC_ERP).sum(\c -> c.StandardAmountBilling.Amount)
      }
    } else {
      if (taxDeductible) {
        subTotal = CostDatas.where(\c -> c.ChargePattern == ChargePattern.TC_WAL || c.ChargePattern == ChargePattern.TC_WARP || c.ChargePattern == ChargePattern.TC_WSL).sum(\c -> c.ActualAmountBilling.Amount)
      } else {
        subTotal = CostDatas.where(\c -> c.ChargePattern == ChargePattern.TC_EL || c.ChargePattern == ChargePattern.TC_ERP).sum(\c -> c.ActualAmountBilling.Amount)
      }
    }
    return subTotal
  }

  function calculateTotalDifference(costs : List<SHCCost>) : BigDecimal {
    var diff = BigDecimal.ZERO
    costs.each(\cost -> {
      var basedOnCost = cost.BasedOn
      if (basedOnCost != null) {
        // If premium threshold override exists use override value
        if (checkForPremiumThresholdOverried()) {
          if (cost.OverrideAmount_amt != null) { // cost wasn't overridden
            diff += cost.OverrideAmount_amt - basedOnCost.ActualAmountBilling_amt
          }
        } else {
          diff += cost.ActualAmountBilling_amt - basedOnCost.ActualAmountBilling_amt
        }
      }
    })
    return diff
  }

  // Used by the extractCostDatasFromExistingCosts method.  Must be implemented if that method is going to be called
  override protected function createCostDataForCost(c: Cost): CostData {
    var cd: CostData

    switch (typeof c) {
      // Each Cost subtype should be listed here, creating a corresponding CostData subtype.  For example...
      case CWPSEarnersLevyCost:
        cd = new CWPSEarnersLevyCostData(c, RateCache)
        break
      case CWPSResidualEarnersLevyCost:
        cd = new CWPSResidualEarnersLevyCostData(c, RateCache)
        break
      case CWPSWorkAccountLevyCost:
        cd = new CWPSWorkAccountLevyCostData(c, RateCache)
        break
      case CWPSResidualWorkAccountLevyCost:
        cd = new CWPSResidualWorkAccountLevyCostData(c, RateCache)
        break
      case CWPSWorkingSaferLevyCost:
        cd = new CWPSWorkingSaferLevyCostData(c, RateCache)
        break
      case CWPSModifierCost:
        cd = new CWPSModifierCostData(c, RateCache)
        break
      case SHCDeductibleTaxCost:
        cd = new SHCDeductibleTaxCostData(c, RateCache)
        break
      case SHCNonDeductibleTaxCost:
        cd = new SHCNonDeductibleTaxCostData(c, RateCache)
        break
      default:
        throw "Unexpected cost type ${c.DisplayName}"
    }
    return cd
  }

  protected override function handleCalcRoutineException(ex : CalcRoutineExecutionException) {
    super.handleCalcRoutineException(ex)
  }

  protected override function createDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return new SHCDeductibleTaxCostData(Branch.PeriodStart, Branch.PeriodEnd, TaxRatingCurrency, RateCache)
  }

  protected override function createNonDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return new SHCNonDeductibleTaxCostData(Branch.PeriodStart, Branch.PeriodEnd, TaxRatingCurrency, RateCache)
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifierID: Key, modifierDate : Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    var costData = new CWPSModifierCostData(effDate, expDate, coveredItemID, modifierID, modifierDate)
    costData.ChargePattern = ChargePattern.TC_WAL
    return costData
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifier: Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    var costData = new CWPSModifierCostData(effDate, expDate, coveredItemID, modifier)
    costData.ChargePattern = ChargePattern.TC_WAL
    return costData
  }

  override function getProvisionalModifierCosts(): Cost[] {
    return PolicyLine.SHCCosts.where(\elt -> elt typeis CWPSModifierCost)
  }

  /******
   * This default version of this method will return all of the Costs on a policy for the slice's effective date.  If some of the
   * costs on a policy are created as part of the "rate window" portion of the rating algorithm (that is, they are created at the
   * end for the entire period rather than created as part of rating each slice in time), then these costs should be excluded
   * from what is returned by this method.  Override this method to return only the types of costs that would be created during the
   * rateSlice portion of the algorithm in that case.
   ******/
  override protected function existingSliceModeCosts(): Iterable<Cost> {
    return PolicyLine.Costs.where(\c -> c typeis CWPSLiableCostData)
  }

  override property get NumDaysInCoverageRatedTerm(): int {
    var prorater = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    var endDate = Plugins.get(IPolicyTermPlugin).calculatePeriodEnd(Branch.StartOfRatedTerm, Branch.Policy.Product.DefaultTermType, Branch)
    return prorater.financialDaysBetween(endDate, Branch.StartOfRatedTerm)
  }

  /**
   * Update cost with migration values. This is executed for migration transactions
   */
  override function updateDataMigrationCosts(lineVersion: CWPSLine) {
    if (_LOG.DebugEnabled) {
      _LOG.debug(_LOG_TAG + "updateDataMigrationCosts enter")
    }

    // get migrated costs and apply
    if (not (lineVersion.Branch.IsAEPMigration and hasUpdateAEPDataMigrationCosts(lineVersion))) {
      for (migrationSHCCost in lineVersion.MigrationSHCCosts) {
        createCostData(lineVersion, migrationSHCCost, null)
        lineVersion.removeFromMigrationSHCCosts(migrationSHCCost)
      }
      for (cwpscov in lineVersion.CWPSCovs) {
        for (migrationSHCCost in cwpscov.MigrationSHCCosts) {
          createCostData(lineVersion, migrationSHCCost, cwpscov)
          cwpscov.removeFromMigrationSHCCosts(migrationSHCCost)
        }
      }
    }

    if (_LOG.DebugEnabled) _LOG.debug(_LOG_TAG + "updateDataMigrationCosts exit")
  }

  private function createCostData(lineVersion: entity.CWPSLine, migrationSHCCost: MigrationSHCCostInfo_ACC, cwpscov: CWPSCov) {
    var policyLine = lineVersion.getSlice(Branch.PeriodStart)

    // find cost of this type
    var cost: entity.SHCCost
    foreach(shccost in policyLine.SHCCosts) {
      // only one cost for each type in migration
      if (shccost.Subtype == migrationSHCCost.SHCCostSubtype) {
        if(shccost typeis CWPSModifierCost) {
          if(shccost.Modifier.PatternCode == migrationSHCCost.ModifierPattern) {
            cost = shccost
            break
          }
        } else if(shccost.Code == migrationSHCCost.cuCode) {
          cost = shccost
          break
        }
      }
    }

    // just create a new one
    if(cost == null) {
      switch(migrationSHCCost.SHCCostSubtype) {
        case typekey.SHCCost.TC_SHCDEDUCTIBLETAXCOST:
          cost = new SHCDeductibleTaxCost(Branch)
          break
        case typekey.SHCCost.TC_SHCNONDEDUCTIBLETAXCOST:
          cost = new SHCNonDeductibleTaxCost(Branch)
          break
        case typekey.SHCCost.TC_CWPSEARNERSLEVYCOST:
          cost = new CWPSEarnersLevyCost(Branch)
          break
        case typekey.SHCCost.TC_CWPSRESIDUALEARNERSLEVYCOST:
          cost = new CWPSResidualEarnersLevyCost(Branch)
          break
        case typekey.SHCCost.TC_CWPSRESIDUALWORKACCOUNTLEVYCOST:
          cost = new CWPSResidualWorkAccountLevyCost(Branch)
          break
        case typekey.SHCCost.TC_CWPSWORKACCOUNTLEVYCOST:
          cost = new CWPSWorkAccountLevyCost(Branch)
          break
        case typekey.SHCCost.TC_CWPSWORKINGSAFERLEVYCOST:
          cost = new CWPSWorkingSaferLevyCost(Branch)
          break

        case typekey.SHCCost.TC_CWPSMODIFIERCOST:
          cost = new CWPSModifierCost(Branch)
          break
        default:
          throw "Unexpected cost type ${migrationSHCCost.SHCCostSubtype}"
      }

    }
    cost.setCWPSLine(lineVersion)
    if(cost typeis CWPSLiableCost) {
      cost.CWPSCov = cwpscov
    }

    // set some type specific fields
    switch (typeof cost) {
      case CWPSModifierCost:
        var modifier = policyLine.SHCLineModifiers.firstWhere(\elt -> elt.PatternCode == migrationSHCCost.ModifierPattern)
        cost.Modifier = modifier
        break
      case CWPSResidualWorkAccountLevyCost:
        cost.ResWorkAccountLevyCostItem = policyLine.CWPSCovs.first().ResidualWorkAccountLevyCosts.firstWhere(\elt -> elt.Code == migrationSHCCost.cuCode)
        break
      case CWPSWorkAccountLevyCost:
        cost.CWPSWorkAccountLevyCostItem = policyLine.CWPSCovs.first().WorkAccountLevyCosts.firstWhere(\elt -> elt.Code == migrationSHCCost.cuCode)
        break
    }

    // set migrated values
    cost.setActualAmountBilling(migrationSHCCost.ActualTermAmount)
    cost.setActualTermAmountBilling(migrationSHCCost.ActualTermAmount)
    cost.setStandardAmountBilling(migrationSHCCost.ActualTermAmount)
    cost.setStandardTermAmountBilling(migrationSHCCost.ActualTermAmount)

    cost.setActualAmount(migrationSHCCost.ActualTermAmount)
    cost.setActualTermAmount(migrationSHCCost.ActualTermAmount)
    cost.setStandardAmount(migrationSHCCost.ActualTermAmount)
    cost.setStandardTermAmount(migrationSHCCost.ActualTermAmount)

    cost.setActualAdjRate(migrationSHCCost.ActualAdjRate)
    cost.setActualBaseRate(migrationSHCCost.ActualAdjRate)

    cost.setChargePattern(migrationSHCCost.ChargePattern)
    cost.setBasis(migrationSHCCost.Basis)
    cost.setRoundingLevel(migrationSHCCost.RoundingLevel)
    cost.setRateAmountType(migrationSHCCost.RateAmountType)
    cost.setNumDaysInRatedTerm(migrationSHCCost.NumDaysInRatedTerm)
    cost.setEffectiveDate(Branch.PeriodStart)
    cost.setExpirationDate(Branch.PeriodEnd)
    cost.setOverrideSource(OverrideSourceType.TC_RENEWALCAP)

    // cost data
    // this is just slightly different than createCostDataForCost
    var costData: SHCCostData
    switch (typeof cost) {
      case SHCDeductibleTaxCost:
        costData = new SHCDeductibleTaxCostData(cost)
        break
      case SHCNonDeductibleTaxCost:
        costData = new SHCNonDeductibleTaxCostData(cost)
        break
      case CWPSEarnersLevyCost:
        costData = new CWPSEarnersLevyCostData(cost)
        break
      case CWPSResidualEarnersLevyCost:
        costData = new CWPSResidualEarnersLevyCostData(cost)
        break
      case CWPSResidualWorkAccountLevyCost:
        costData = new CWPSResidualWorkAccountLevyCostData(cost)
        break
      case CWPSWorkAccountLevyCost:
        costData = new CWPSWorkAccountLevyCostData(cost)
        break
      case CWPSWorkingSaferLevyCost:
        costData = new CWPSWorkingSaferLevyCostData(cost)
        break
      case CWPSModifierCost:
        costData = new CWPSModifierCostData(cost)
        break
      default:
        throw "Unexpected cost type ${cost.DisplayName}"
    }

    // set migrated values
    costData.ActualAmountBilling = migrationSHCCost.ActualTermAmount
    costData.ActualTermAmountBilling = migrationSHCCost.ActualTermAmount
    costData.StandardAmountBilling = migrationSHCCost.ActualTermAmount
    costData.StandardTermAmountBilling = migrationSHCCost.ActualTermAmount

    costData.ActualAmount = migrationSHCCost.ActualTermAmount
    costData.ActualTermAmount = migrationSHCCost.ActualTermAmount
    costData.StandardAmount = migrationSHCCost.ActualTermAmount
    costData.StandardTermAmount = migrationSHCCost.ActualTermAmount

    costData.ActualAdjRate = migrationSHCCost.ActualAdjRate
    costData.ActualBaseRate = migrationSHCCost.ActualAdjRate

    costData.ChargePattern = migrationSHCCost.ChargePattern
    costData.Basis = migrationSHCCost.Basis
    costData.RoundingLevel = migrationSHCCost.RoundingLevel
    costData.RateAmountType = migrationSHCCost.RateAmountType
    costData.NumDaysInRatedTerm = migrationSHCCost.NumDaysInRatedTerm
    costData.EffectiveDate = Branch.PeriodStart
    costData.ExpirationDate = Branch.PeriodEnd
    costData.OverrideSource = OverrideSourceType.TC_RENEWALCAP

    // add to cost data map
    var results = CostDataMap
    var costDataList = results.get(lineVersion)
    if(costDataList == null) {costDataList = {}}
    costDataList.add(costData)
    results.put(lineVersion, costDataList)
  }

  function hasUpdateAEPDataMigrationCosts(lineVersion: CWPSLine) : boolean {
    var aepMigrationInfo = lineVersion.Branch.Job.MigrationJobInfo_ACC.AEPMigrationInfo

    // Zero rated the aep migration transaction
    if (lineVersion.Branch.IsAEPMigrationZeroRatedTransaction_ACC) {
      // Keep the total cost/premium RPT to be used in later transaction
      if (lineVersion.Branch.Job typeis Submission) {
        aepMigrationInfo.TotalPremiumRPT = lineVersion.Branch.TotalPremiumRPT
        aepMigrationInfo.TotalCostRPT = lineVersion.Branch.TotalCostRPT
      }
      // Clear the total cost/premium RPT for current transaction
      lineVersion.Branch.TotalPremiumRPT = new MonetaryAmount(0, Currency.TC_NZD)
      lineVersion.Branch.TotalCostRPT = new MonetaryAmount(0, Currency.TC_NZD)
      return true
    }

    // For some AEP migration transaction, the migrated costs need to be retained for use in later transaction.
    // Those transactions will be processed here.  Otherwise the transaction will be processed as normal migrated policy.
    if (AEPMigrationType_ACC.TF_RETAIN_MIGRATION_COSTS.TypeKeys.contains(aepMigrationInfo.AEPMigrationType)) {
      // For mid term entry, the submission is not rated zero.
      // However the total cost/premium RPT will be needed in the cancellation for zero rated.
      if (aepMigrationInfo.AEPMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_ENTRY and
          lineVersion.Branch.Job typeis Submission) {
        aepMigrationInfo.TotalPremiumRPT = lineVersion.Branch.TotalPremiumRPT
        aepMigrationInfo.TotalCostRPT = lineVersion.Branch.TotalCostRPT
      }
      // Normally, the migration cost will be in current line.
      // For some of AEP migration transactions, the migration cost will need to be retrieved from the inital submission.
      var lineVersionWithMigrationCosts = lineVersion
      if (aepMigrationInfo.AEPMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_ENTRY and
          lineVersion.Branch.Job typeis Cancellation) {
        lineVersionWithMigrationCosts = lineVersion.Branch.BasedOn.CWPSLine
        lineVersion.Branch.TotalPremiumRPT = aepMigrationInfo.TotalPremiumRPT
        lineVersion.Branch.TotalCostRPT = aepMigrationInfo.TotalCostRPT
      } else if (aepMigrationInfo.AEPMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_EXIT and
          lineVersion.Branch.Job typeis RewriteNewAccount) {
        lineVersionWithMigrationCosts = lineVersion.Branch.Policy.RewrittenToNewAccountSource
                                                                 .RewrittenToNewAccountSource
                                                                 .Periods.firstWhere(\pp -> pp.Job typeis Submission).CWPSLine
        lineVersion.Branch.TotalPremiumRPT = aepMigrationInfo.TotalPremiumRPT
        lineVersion.Branch.TotalCostRPT = aepMigrationInfo.TotalCostRPT
      }
      else if (lineVersion.Branch.Job typeis Audit) {
        // If audit job, we need to copy costs from the original submission.
        if (aepMigrationInfo.AEPMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_ENTRY) {
          // For mid-term entry, we copy costs from the same policy, so we need to do 2 basedOns to get
          // to cancellation and then submission.
          lineVersionWithMigrationCosts = lineVersion.Branch.BasedOn.BasedOn.CWPSLine
          lineVersion.Branch.TotalPremiumRPT = aepMigrationInfo.TotalPremiumRPT
          lineVersion.Branch.TotalCostRPT = aepMigrationInfo.TotalCostRPT
        }
        else if (aepMigrationInfo.AEPMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_EXIT) {
          // For mid-term exit, we need to copy costs from the original policy submission, so we need to go
          // back to the source policy of 2 rewrites in order to get to the submission.
          lineVersionWithMigrationCosts = lineVersion.Branch.Policy.RewrittenToNewAccountSource
                                                                   .RewrittenToNewAccountSource
                                                                   .Periods.firstWhere(\pp -> pp.Job typeis Submission).CWPSLine
          lineVersion.Branch.TotalPremiumRPT = aepMigrationInfo.TotalPremiumRPT
          lineVersion.Branch.TotalCostRPT = aepMigrationInfo.TotalCostRPT
        }
      }
      // process the migrated cost
      for (migrationSHCCost in lineVersionWithMigrationCosts.MigrationSHCCosts) {
        createCostData(lineVersion, migrationSHCCost, null)
      }
      var currentCov = lineVersion.CWPSCovs.first()
      for (cwpscov in lineVersionWithMigrationCosts.CWPSCovs) {
        for (migrationSHCCost in cwpscov.MigrationSHCCosts) {
          createCostData(lineVersion, migrationSHCCost, currentCov)
        }
      }
      return true
    }
    return false
  }
}
