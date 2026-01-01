package nz.co.acc.lob.ind.rating

uses entity.*
uses gw.pl.persistence.core.Key
uses gw.rating.CostData
uses gw.rating.CostDataWithOverrideSupport
uses gw.rating.RateFlowLogger

uses java.math.RoundingMode
uses java.util.Date
uses java.math.BigDecimal

uses java.lang.Iterable

uses gw.financials.Prorater
uses gw.plugin.Plugins
uses gw.plugin.policyperiod.IPolicyTermPlugin
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.Pair
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.migration.rating.AbstractMigrationRatingEngine_ACC
uses typekey.*


class INDRatingEngine extends AbstractMigrationRatingEngine_ACC<INDCoPLine> {

  static var _rfLogger = RateFlowLogger.Logger
  static var _LOG = StructuredLogger.CONFIG.withClass(INDRatingEngine)
  static var _LOG_TAG = "${AbstractMigrationRatingEngine_ACC.Type.RelativeName} - "

  var _baseRatingDate: Date
  var _uwCompanyRateFactor: BigDecimal
  var _proRataFactor : BigDecimal
  var _rateAsZero = false

  construct(line: INDCoPLine) {
    this(line, RateBookStatus.TC_ACTIVE)
  }

  construct(line: INDCoPLine, minimumRatingLevel: RateBookStatus) {
    super(line, minimumRatingLevel)
    _baseRatingDate = line.Branch.RateAsOfDate
    _uwCompanyRateFactor = line.Branch.getUWCompanyRateFactor(_baseRatingDate, _jurisdiction)
  }

  override protected function rateSlice(lineVersion: INDCoPLine) {
    assertSliceMode(lineVersion)

    if (lineVersion.Branch.isCanceledSlice()) {
      // Do nothing if this is a canceled slice
    } else {
      // Implementation moved over to rateWindow
    }
  }

  private function rateWorkAccountLevyCosts(lineVersion : INDCoPLine) {
    var indCoPCov = lineVersion.INDCoPCovs.first()
    var workAccountLevyCosts = lineVersion.INDCoPCovs.first().WorkAccountLevyCosts
    // For CP there is only one BIC code
    var bicCode = lineVersion?.BICCodes?.first()
    var cuItem : INDCoPWorkAccountLevyCostItem

    if(workAccountLevyCosts.length > 0) {
      cuItem = workAccountLevyCosts.firstWhere(\elt -> elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
      if(cuItem != null and !cuItem.Code.equals(bicCode.CUCode)) {
        cuItem.removeWM()
      }
    }

    if (bicCode != null) {
      // clear the costs
      if(lineVersion.INDCoPCovs.first().WorkAccountLevyCosts.length == 0) {
        cuItem = new INDCoPWorkAccountLevyCostItem(indCoPCov.Branch)
        cuItem.setCode(bicCode.CUCode)
        cuItem.setDescription(bicCode.CUDescription)
        cuItem.setAdjustedLiableEarnings(bicCode.AdjustedLiableEarnings)
        cuItem.setCostType(WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
        indCoPCov.addToWorkAccountLevyCosts(cuItem)
      } else {
        cuItem.setAdjustedLiableEarnings(bicCode.AdjustedLiableEarnings)
      }
    }
  }

  private function rateResidualWorkAccountLevyCosts(lineVersion : INDCoPLine) {
    var bicCodes = lineVersion.BICCodes
    var resWorkAccountLevyCosts = lineVersion.INDCoPCovs.first().ResidualWorkAccountLevyCosts
    var cuItem : INDCoPResidualWorkAccountLevyCostItem
    var bicCode = lineVersion?.BICCodes?.first()
    var indCoPCov = lineVersion.INDCoPCovs.first()

    if(resWorkAccountLevyCosts.length > 0) {
      cuItem = resWorkAccountLevyCosts.firstWhere(\elt -> elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
      if(cuItem != null and !cuItem.Code.equals(bicCode.CUCode)) {
        cuItem.removeWM()
      }
    }

    if (bicCodes != null) {

      // clear the costs
      if(lineVersion.INDCoPCovs.first().ResidualWorkAccountLevyCosts.length == 0) {
        cuItem = new INDCoPResidualWorkAccountLevyCostItem(indCoPCov.Branch)
        cuItem.setCode(bicCode.CUCode)
        cuItem.setDescription(bicCode.CUDescription)
        cuItem.setCostType(WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
        indCoPCov.addToResidualWorkAccountLevyCosts(cuItem)
      }
    }
  }

  private function rateWorkAccountLevy(lineVersion : INDCoPLine, cpDates : List<Pair<Date,Date>>) {
    var cov = lineVersion.INDCoPCovs.first()
    assertSliceMode(cov)

    if (cov == null) {
      var msg = "Failed to rate the Work Account Levy."
      throw new IllegalArgumentException(msg)
    }

    var cuItem = cov.WorkAccountLevyCosts.firstWhere(\elt -> elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
    // create an empty CostData -- amounts will be filled in by the rate routine
    var data = createINDCoPWorkAccountLevyCostData(cov, cuItem)
    var existingCost = data.getExistingCost(lineVersion)
    var effectiveDate = lineVersion.EffectiveDate
    var taxableCost = cuItem.AdjustedLiableEarnings.Amount

    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern = ChargePattern.TC_WAL
    data.RoundingLevel = 2

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cov.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap: Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE->lineVersion,
            TC_TAXABLEBASIS->taxableCost,
            TC_CLASSIFICATIONUNIT->cuItem.Code,
            TC_LEVYRATEEFFECTIVEDATE->effectiveDate,
            TC_ER_OR_NCD->BigDecimal.ZERO,
            TC_WSD_OR_WSMP->BigDecimal.ZERO}

    RateBook.executeCalcRoutine(WORK_ACCOUNT_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    var policyPeriod = lineVersion.AssociatedPolicyPeriod

    if(_rateAsZero) {
      data.StandardAmount = BigDecimal.ZERO
    } else if(policyPeriod.INDCPXLineExists and policyPeriod.CeasedTrading_ACC) {
      data.StandardAmount = data.StandardTermAmount - policyPeriod.INDCPXLine.CPXCosts.where(\elt -> elt typeis INDCPXWorkAccountLevyCost).sum(\elt -> elt.ActualAmount_amt)
      if(data.StandardAmount < 0) {
        data.StandardAmount = BigDecimal.ZERO
      }
    } else {
      data.StandardAmount = data.StandardTermAmount * cov.ProRataFactor
    }
    data.ActualAmount = data.StandardAmount

    if (data.Overridable) {
      performOverride(existingCost, data)
    } else {
      data.updateAmountFields(RoundingMode, lineVersion.Branch.PeriodStart)
    }

    if (_rfLogger.DebugEnabled) {
      _rfLogger.debug("Rate LE Coverage")
      _rfLogger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
      _rfLogger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
      _rfLogger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
    }
    // Create a default zero discount amount

    // call addCost() to add the new cost to the collection
    addCost(data)

    var modifiers = lineVersion.getAssociatedPolicyPeriod().
        getEffectiveDatedFields().getProductModifiers()

    var totalLevyAmount = BigDecimal.ZERO
    if(ERStatus == ERStatus_ACC.TC_ER_MODIFIER_PENDING or
        ERStatus == ERStatus_ACC.TC_NEXT_TERM_ER_MODIFIER_PENDING  or
        checkForPremiumThresholdOverried() or
        checkForERModifierOverride()) {
      totalLevyAmount += data.StandardAmount
    } else {
      totalLevyAmount += data.ActualAmount
    }

    totalLevyAmount += rateERModifier(totalLevyAmount, lineVersion, modifiers, 1)

    rateDiscountAppliedModifiers(totalLevyAmount, lineVersion, modifiers, cpDates)
  }

  private function rateResidualWorkAccountLevy(lineVersion : INDCoPLine) {
    var cov = lineVersion.INDCoPCovs.first()
    assertSliceMode(cov)

    if (cov == null ) {
      throw new IllegalArgumentException("Failed to rate Work Residual Levy.")
    }

    // create an empty CostData -- amounts will be filled in by the rate routine
    var start = cov.SliceDate
    var end = getNextSliceDateAfter(start)
    var cuItem = cov.ResidualWorkAccountLevyCosts.first()
    var data = new INDCoPResidualWorkAccountLevyCostData(start, end, cov.getPreferredCoverageCurrency(), RateCache, cov.FixedId, cuItem.FixedId)
    var existingCost = data.getExistingCost(lineVersion)
    var effectiveDate = lineVersion.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern = ChargePattern.TC_WARP
    data.RoundingLevel      = 2

    var taxableCost = createTaxableCost()


    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cov.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE      -> lineVersion,
            TC_TAXABLEBASIS -> taxableCost,
            TC_CLASSIFICATIONUNIT -> cuItem.Code,
            TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate}

    RateBook.executeCalcRoutine(WORK_RESIDUAL_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    preventProRataOfLevy(data)
    if (data.Overridable) {
      performOverride(existingCost, data)
    } else {
      data.updateAmountFields(RoundingMode, lineVersion.Branch.PeriodStart)
    }

    if (_rfLogger.DebugEnabled) {
      _rfLogger.debug("Rate LE Coverage")
      _rfLogger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
      _rfLogger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
      _rfLogger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
    }

    // call addCost() to add the new cost to the collection
    addCost(data)
  }

  private function createINDCoPWorkAccountLevyCostData(indcopcov:INDCoPCov, costItem:INDCoPWorkAccountLevyCostItem) : INDCoPWorkAccountLevyCostData {
    var start = indcopcov.SliceDate
    var end = getNextSliceDateAfter(start)

    var costItemData = new INDCoPWorkAccountLevyCostData(start, end, indcopcov.getPreferredCoverageCurrency(), RateCache, indcopcov.FixedId, costItem.FixedId)
    costItemData.RateBook = RateBook
    costItemData.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    costItemData.ChargePattern = ChargePattern.TC_WAL
    costItemData.RoundingLevel = 2

    return costItemData
  }

  private function createTaxableCost() : BigDecimal {
    var taxableCost = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
    if (PolicyLine.BICCodes != null) {
      taxableCost = PolicyLine.BICCodes.first().AdjustedLiableEarnings
    }
    return taxableCost
  }

  private function rateEarnersLevy(lineVersion : INDCoPLine) {
    var cov = lineVersion.INDCoPCovs.first()
    assertSliceMode(cov)

    if (cov == null ) {
      throw new IllegalArgumentException("Failed to rate Earners Levy.")
    }

    var start = cov.SliceDate
    var end = getNextSliceDateAfter(start)
    var data = new INDCoPEarnersLevyCostData(start, end, cov.getPreferredCoverageCurrency(), RateCache, cov.FixedId)
    var existingCost = data.getExistingCost(lineVersion)
    var effectiveDate = lineVersion.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern      = ChargePattern.TC_EL
    data.RoundingLevel      = 2

    var taxableCost = createTaxableCost()

    // into the routine so it can do rate capping.
    var priorCov = cov.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }
    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE      -> PolicyLine,
            TC_TAXABLEBASIS -> taxableCost,
            TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate,
            TC_CPXINFOCOV        -> null}

    // Earners Levy
    RateBook.executeCalcRoutine(EARNERS_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    var policyPeriod = lineVersion.AssociatedPolicyPeriod

    if(_rateAsZero) {
      data.StandardAmount = BigDecimal.ZERO
    } else if(policyPeriod.INDCPXLineExists and policyPeriod.CeasedTrading_ACC) {
      data.StandardAmount = data.StandardTermAmount - policyPeriod.INDCPXLine.CPXCosts.where(\elt -> elt typeis INDCPXEarnersLevyCost).sum(\elt -> elt.ActualAmount_amt)
      if(data.StandardAmount < 0) {
        data.StandardAmount = BigDecimal.ZERO
      }
    } else {
      data.StandardAmount = data.StandardTermAmount * cov.ProRataFactor
    }

    data.ActualAmount = data.StandardAmount

    if(data.Overridable) {
      performOverride(existingCost, data)
    } else {
      data.updateAmountFields(RoundingMode, lineVersion.Branch.PeriodStart)
    }

    if (_rfLogger.DebugEnabled) {
      _rfLogger.debug("Rate LE Coverage")
      _rfLogger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
      _rfLogger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
      _rfLogger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
    }

    // call addCost() to add the new cost to the collection
    addCost(data)
  }

  private function rateResidualEarnersLevy(lineVersion : INDCoPLine) {

    var cov = lineVersion.INDCoPCovs.first()
    assertSliceMode(cov)

    if (cov == null ) {
      throw new IllegalArgumentException("Failed to rate Earners Residual Levy.")
    }

    // create an empty CostData -- amounts will be filled in by the rate routine
    var start = cov.SliceDate
    var end = getNextSliceDateAfter(start)
    var data = new INDCoPResidualEarnersLevyCostData(start, end, cov.getPreferredCoverageCurrency(), RateCache, cov.FixedId)
    var existingCost = data.getExistingCost(lineVersion)

    var effectiveDate = lineVersion.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern      = ChargePattern.TC_ERP
    data.RoundingLevel      = 2

    var taxableCost = createTaxableCost()

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cov.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE      -> lineVersion,
            TC_TAXABLEBASIS -> taxableCost,
            TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate}

    // Earners Residual Levy
    RateBook.executeCalcRoutine(EARNERS_RESIDUAL_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    preventProRataOfLevy(data)
    if(data.Overridable) {
      performOverride(existingCost, data)
    } else {
      data.updateAmountFields(RoundingMode, lineVersion.Branch.PeriodStart)
    }

    if (_rfLogger.DebugEnabled) {
      _rfLogger.debug("Rate LE Coverage")
      _rfLogger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
      _rfLogger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
      _rfLogger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
    }

    // call addCost() to add the new cost to the collection
    addCost(data)
  }

  private function rateWorkingSaferLevy(lineVersion : INDCoPLine) {
    if(lineVersion.AssociatedPolicyPeriod.LevyYear_ACC >= ScriptParameters.WorkingSaferStartLevyYear_ACC and
        _proRataFactor == BigDecimal.ZERO) {
      return
    }

    var cov = lineVersion.INDCoPCovs.first()
    assertSliceMode(cov)

    if (cov == null ) {
      throw new IllegalArgumentException("Failed to rate Working Safer Levy.")
    }

    // create an empty CostData -- amounts will be filled in by the rate routine
    var start = cov.SliceDate
    var end = getNextSliceDateAfter(start)

    var data = new INDCoPWorkingSaferLevyCostData(start, end, cov.getPreferredCoverageCurrency(), RateCache, cov.FixedId)
    var existingCost = data.getExistingCost(lineVersion)
    var effectiveDate = lineVersion.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern      = ChargePattern.TC_WSL
    data.RoundingLevel      = 2

    var taxableCost = createTaxableCost()

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cov.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cov.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE      -> lineVersion,
            TC_TAXABLEBASIS -> taxableCost,
            TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate}

    // Earners Residual Levy
    RateBook.executeCalcRoutine(WORKING_SAFER_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    if(lineVersion.AssociatedPolicyPeriod.LevyYear_ACC >= ScriptParameters.WorkingSaferStartLevyYear_ACC) {
      data.StandardAmount = data.StandardTermAmount * _proRataFactor
      data.ActualAmount = data.StandardAmount
    } else {
      preventProRataOfLevy(data)
    }

    if(data.Overridable) {
      performOverride(existingCost, data)
    } else {
      data.updateAmountFields(RoundingMode, lineVersion.Branch.PeriodStart)
    }

    if (_rfLogger.DebugEnabled) {
      _rfLogger.debug("Rate LE Coverage")
      _rfLogger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
      _rfLogger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
      _rfLogger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
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
  override protected function rateWindow(line: INDCoPLine) {
    var logMsg = "Rating across policy term..."
    if (_rfLogger.DebugEnabled) {
      _rfLogger.debug(logMsg)
    }

    _proRataFactor = calculateCPProRataFactor()

    var cpDates : List<Pair<Date,Date>> = new ArrayList<Pair<Date,Date>>()
    var policyPeriod = line.AssociatedPolicyPeriod

    if(policyPeriod.INDCPXLineExists) {
      cpDates = getCoverPlusEffectiveDates(policyPeriod.INDCPXLine.INDCPXCovs.first().CPXInfoCovs)
    }  else {
      cpDates.add(new Pair<Date,Date>(line.EffectiveDate, line.ExpirationDate))
    }

    if(policyPeriod.CeasedTrading_ACC) {
      var hasCPDatesbeforeCease = cpDates.where(\elt -> elt.First.beforeOrEqual(policyPeriod.CeasedTradingDate_ACC))
                                         .hasMatch(\elt1 -> elt1.First.beforeOrEqual(policyPeriod.CeasedTradingDate_ACC))
      if(!hasCPDatesbeforeCease) {
        _rateAsZero = true
      }
    }

    /***********
     *
     * Rating logic for rating 1 slice of the line goes here
     *
     ***********/

    if(_proRataFactor != BigDecimal.ZERO) {
      // Only cost the work account levy if CPX Line does not exist in the policy
      rateWorkAccountLevyCosts(line)
    } else {
      // clear the costs - Item exists in CPX
      line.INDCoPCovs.first().WorkAccountLevyCosts = {}
    }

    if(_proRataFactor != BigDecimal.ZERO) {
      // Only cost the work account and earnners levy if CPX Line does not exist in the policy
      rateWorkAccountLevy(line, cpDates)
      rateEarnersLevy(line)
    }

    rateWorkingSaferLevy(line)

    // Only perform this rating if the policy effective date is before the ACC Work Residual Levy End Date
    if (DateUtil_ACC.isDatePriorACCWorkResidualLevyEndDate(line.EffectiveDate)) {
      rateResidualWorkAccountLevyCosts(line)
      rateResidualWorkAccountLevy(line)
    }
    // Only perform this rating if the policy effective date is before the ACC Earners Residual Levy End Date
    if (DateUtil_ACC.isDatePriorACCEarnersResidualLevyEndDate(line.EffectiveDate)) {
      rateResidualEarnersLevy(line)
    }

    calculateGST()

    if (_rfLogger.DebugEnabled) {
      _rfLogger.debug(logMsg + " done")
    }
  }

  // Used by the extractCostDatasFromExistingCosts method.  Must be implemented if that method is going to be called
  override protected function createCostDataForCost(c: Cost): CostData {
    var cd: CostData

    switch (typeof c) {
      // Each Cost subtype should be listed here, creating a corresponding CostData subtype.  For example...
      case INDCoPEarnersLevyCost:
        cd = new INDCoPEarnersLevyCostData(c, RateCache)
        break
      case INDCoPResidualEarnersLevyCost:
        cd = new INDCoPResidualEarnersLevyCostData(c, RateCache)
        break
      case INDCoPWorkAccountLevyCost:
        cd = new INDCoPWorkAccountLevyCostData(c, RateCache)
        break
      case INDCoPResidualWorkAccountLevyCost:
        cd = new INDCoPResidualWorkAccountLevyCostData(c, RateCache)
        break
      case INDCoPWorkingSaferLevyCost:
        cd = new INDCoPWorkingSaferLevyCostData(c, RateCache)
        break
      case INDCoPLiableEarningsCost:
        cd = new INDCoPLiableEarningsCostData(c, RateCache)
        break
      case INDCoPModifierCost:
        cd = new INDCoPModifierCostData(c, RateCache)
        break
      default:
        throw "Unexpected cost type ${c.DisplayName}"
    }
    return cd
  }

  protected override function createDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return new INDCoPTaxCostData(Branch.PeriodStart, Branch.PeriodEnd, TaxRatingCurrency, RateCache)
  }

  protected override function createNonDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return null
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifierID: Key, modifierDate : Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    var costData = new INDCoPModifierCostData(effDate, expDate, PolicyLine.PreferredCoverageCurrency, RateCache, coveredItemID, modifierID, modifierDate)
    costData.ChargePattern = ChargePattern.TC_WAL
    return costData
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifier: Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    var costData = new INDCoPModifierCostData(effDate, expDate, PolicyLine.PreferredCoverageCurrency, RateCache, coveredItemID, modifier)
    costData.ChargePattern = ChargePattern.TC_WAL
    return costData
  }

  override function getProvisionalModifierCosts(): Cost[] {
    return null
  }

  /******
   * This default version of this method will return all of the Costs on a policy for the slice's effective date.  If some of the
   * costs on a policy are created as part of the "rate window" portion of the rating algorithm (that is, they are created at the
   * end for the entire period rather than created as part of rating each slice in time), then these costs should be excluded
   * from what is returned by this method.  Override this method to return only the types of costs that would be created during the
   * rateSlice portion of the algorithm in that case.
   ******/
  override protected function existingSliceModeCosts(): Iterable<Cost> {
    return PolicyLine.Costs.where(\c -> c typeis INDCoPLiableEarningsCost)
  }

  override property get NumDaysInCoverageRatedTerm(): int {
    var prorater = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    var endDate = Plugins.get(IPolicyTermPlugin).calculatePeriodEnd(Branch.StartOfRatedTerm, Branch.Policy.Product.DefaultTermType, Branch)
    return prorater.financialDaysBetween(endDate, Branch.StartOfRatedTerm)
  }

  /**
   * Update cost with migration values. This is executed for migration transactions
   */
  override function updateDataMigrationCosts(lineVersion: INDCoPLine) {
    if (_LOG.DebugEnabled) {
      _LOG.debug(_LOG_TAG + "updateDataMigrationCosts enter")
    }

    // get migrated costs and apply
    for(migrationINDCost in lineVersion.MigrationINDCosts) {
      createCostData(lineVersion, migrationINDCost, null)
      lineVersion.removeFromMigrationINDCosts(migrationINDCost)
    }
    for(indCoPCov in lineVersion.INDCoPCovs) {
      for(migrationINDCost in indCoPCov.MigrationINDCosts) {
        createCostData(lineVersion, migrationINDCost, indCoPCov)
        indCoPCov.removeFromMigrationINDCosts(migrationINDCost)
      }
    }

    if (_LOG.DebugEnabled) _LOG.debug(_LOG_TAG + "updateDataMigrationCosts exit")
  }

  private function calculateCPProRataFactor() : BigDecimal {
    var proRataFactor = BigDecimal.ONE

    if(PolicyLine.getAssociatedPolicyPeriod().INDCPXLineExists) {
      var cpxLine = PolicyLine.getAssociatedPolicyPeriod().INDCPXLine
      for (cpxEarning in cpxLine.INDCPXCovs.first().CPXInfoCovs) {
        proRataFactor -= cpxEarning.ProRataFactor
      }
    }

    return proRataFactor
  }

  private function createCostData(lineVersion: entity.INDCoPLine, migrationINDCost: MigrationINDCostInfo_ACC, indCoPCov: INDCoPCov) {
    var policyLine = lineVersion.getSlice(Branch.PeriodStart)
    // find cost of this type
    var cost: entity.INDCost
    foreach(indcost in policyLine.INDCosts) {
      if (indcost.Subtype == migrationINDCost.INDCostSubtype) {
        if (indcost typeis INDCoPModifierCost) {
          if (indcost.Modifier.PatternCode == migrationINDCost.ModifierPattern) {
            cost = indcost
            break
          }
        } else {
          cost = indcost
          break
        }
      }
    }

    // just create a new one
    if (cost == null) {
      switch (migrationINDCost.INDCostSubtype) {
        case typekey.INDCost.TC_INDCOPTAXCOST:
          cost = new INDCoPTaxCost(Branch)
          break
        case typekey.INDCost.TC_INDCOPCLASSIFICATIONUNITCOST:
          cost = new INDCoPClassificationUnitCost(Branch)
          break
        case typekey.INDCost.TC_INDCOPEARNERSLEVYCOST:
          cost = new INDCoPEarnersLevyCost(Branch)
          break
        case typekey.INDCost.TC_INDCOPLIABLEEARNINGSCOST:
          cost = new INDCoPLiableEarningsCost(Branch)
          break
        case typekey.INDCost.TC_INDCOPMODIFIERCOST:
          cost = new INDCoPModifierCost(Branch)
          break
        case typekey.INDCost.TC_INDCOPRESIDUALEARNERSLEVYCOST:
          cost = new INDCoPResidualEarnersLevyCost(Branch)
          break
        case typekey.INDCost.TC_INDCOPRESIDUALWORKACCOUNTLEVYCOST:
          cost = new INDCoPResidualWorkAccountLevyCost(Branch)
          break
        case typekey.INDCost.TC_INDCOPWORKACCOUNTLEVYCOST:
          cost = new INDCoPWorkAccountLevyCost(Branch)
          break
        case typekey.INDCost.TC_INDCOPWORKINGSAFERLEVYCOST:
          cost = new INDCoPWorkingSaferLevyCost(Branch)
          break
        default:
          throw "Unexpected cost type ${migrationINDCost.INDCostSubtype.DisplayName}"
      }
    }

    // set parents
    cost.setINDCoPLine(lineVersion)
    if (cost typeis INDCoPLiableEarningsCost) {
      cost.INDCoPCov = indCoPCov
    }

    // set some type specific fields

    // not using switch case as we need the type casting
    if (cost typeis INDCoPModifierCost) {
      var modifier = policyLine.Branch.EffectiveDatedFields.ProductModifiers.firstWhere(\elt -> elt.PatternCode == migrationINDCost.ModifierPattern)
      cost.Modifier = modifier
    } else if(cost typeis INDCoPResidualWorkAccountLevyCost) {
          cost.ResWorkAccountLevyCostItem = policyLine.INDCoPCovs.first().ResidualWorkAccountLevyCosts.first()
    } else if(cost typeis INDCoPWorkAccountLevyCost) {
          cost.WorkAccountLevyCostItem = policyLine.INDCoPCovs.first().WorkAccountLevyCosts.first()
    }


    // set migrated values
    cost.setActualAmountBilling(migrationINDCost.ActualTermAmount)
    cost.setActualTermAmountBilling(migrationINDCost.ActualTermAmount)
    cost.setStandardAmountBilling(migrationINDCost.ActualTermAmount)
    cost.setStandardTermAmountBilling(migrationINDCost.ActualTermAmount)

    cost.setActualAmount(migrationINDCost.ActualTermAmount)
    cost.setActualTermAmount(migrationINDCost.ActualTermAmount)
    cost.setStandardAmount(migrationINDCost.ActualTermAmount)
    cost.setStandardTermAmount(migrationINDCost.ActualTermAmount)

    cost.setActualAdjRate(migrationINDCost.ActualAdjRate)
    cost.setActualBaseRate(migrationINDCost.ActualAdjRate)

    cost.setChargePattern(migrationINDCost.ChargePattern)
    cost.setBasis(migrationINDCost.Basis)
    cost.setRoundingLevel(migrationINDCost.RoundingLevel)
    cost.setRateAmountType(migrationINDCost.RateAmountType)
    cost.setNumDaysInRatedTerm(migrationINDCost.NumDaysInRatedTerm)
    cost.setEffectiveDate(Branch.PeriodStart)
    cost.setExpirationDate(Branch.PeriodEnd)
    cost.setOverrideSource(OverrideSourceType.TC_RENEWALCAP)

    // cost data
    // this is just slightly different than createCostDataForCost
    var costData: INDCostData
    switch (typeof cost) {
      case INDCoPTaxCost:
        costData = new INDCoPTaxCostData(cost)
        break
      case INDCoPEarnersLevyCost:
        costData = new INDCoPEarnersLevyCostData(cost)
        break
      case INDCoPLiableEarningsCost:
        costData = new INDCoPLiableEarningsCostData(cost)
        break
      case INDCoPModifierCost:
        costData = new INDCoPModifierCostData(cost)
        break
      case INDCoPResidualEarnersLevyCost:
        costData = new INDCoPResidualEarnersLevyCostData(cost)
        break
      case INDCoPResidualWorkAccountLevyCost:
        costData = new INDCoPResidualWorkAccountLevyCostData(cost)
        break
      case INDCoPWorkAccountLevyCost:
        costData = new INDCoPWorkAccountLevyCostData(cost)
        break
      case INDCoPWorkingSaferLevyCost:
        costData = new INDCoPWorkingSaferLevyCostData(cost)
        break
      default:
        throw "Unexpected cost type ${cost.DisplayName}"

    }

    // set migrated values
    costData.ActualAmountBilling = migrationINDCost.ActualTermAmount
    costData.ActualTermAmountBilling = migrationINDCost.ActualTermAmount
    costData.StandardAmountBilling = migrationINDCost.ActualTermAmount
    costData.StandardTermAmountBilling = migrationINDCost.ActualTermAmount

    costData.ActualAmount = migrationINDCost.ActualTermAmount
    costData.ActualTermAmount = migrationINDCost.ActualTermAmount
    costData.StandardAmount = migrationINDCost.ActualTermAmount
    costData.StandardTermAmount = migrationINDCost.ActualTermAmount

    costData.ActualAdjRate = migrationINDCost.ActualAdjRate
    costData.ActualBaseRate = migrationINDCost.ActualAdjRate

    costData.ChargePattern = migrationINDCost.ChargePattern
    costData.Basis = migrationINDCost.Basis
    costData.RoundingLevel = migrationINDCost.RoundingLevel
    costData.RateAmountType = migrationINDCost.RateAmountType
    costData.NumDaysInRatedTerm = migrationINDCost.NumDaysInRatedTerm
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
}
