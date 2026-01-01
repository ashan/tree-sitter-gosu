package nz.co.acc.lob.emp.rating

uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.Key
uses gw.api.financials.CurrencyAmount

uses gw.financials.Prorater
uses gw.plugin.Plugins
uses gw.plugin.policyperiod.IPolicyTermPlugin
uses gw.rating.CostData
uses gw.rating.CostDataWithOverrideSupport
uses gw.rating.RateFlowLogger
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.common.rating.function.NextTermModifierOverrideHandler
uses nz.co.acc.lob.util.ProRationUtil_ACC
uses nz.co.acc.migration.rating.AbstractMigrationRatingEngine_ACC
uses nz.co.acc.lob.common.rating.function.CancelProrataFactor
uses typekey.Job

uses java.math.BigDecimal
uses java.math.BigInteger

class EMPRatingEngine extends AbstractMigrationRatingEngine_ACC<EMPWPCLine> {

  static var _rfLogger = RateFlowLogger.Logger
  static var _LOG = StructuredLogger.CONFIG.withClass(EMPRatingEngine)
  static var _LOG_TAG = "${AbstractMigrationRatingEngine_ACC.Type.RelativeName} - "

  var _baseRatingDate: Date
  var _uwCompanyRateFactor: BigDecimal

  construct(line: EMPWPCLine) {
    this(line, RateBookStatus.TC_ACTIVE)
  }

  construct(line: EMPWPCLine, minimumRatingLevel: RateBookStatus) {
    super(line, minimumRatingLevel)
    _baseRatingDate = line.Branch.RateAsOfDate
    _uwCompanyRateFactor = line.Branch.getUWCompanyRateFactor(_baseRatingDate, _jurisdiction)
    _minimumRatingLevel = minimumRatingLevel
  }

  override protected function rateSlice(lineVersion: productmodel.EMPWPCLine) {
    assertSliceMode(lineVersion)
    if (lineVersion.Branch.isCanceledSlice()) {
      // Do nothing if this is a canceled slice
    } else {
      // Implementation moved over to rateWindow
    }
  }

  private function rateWorkAccountLevyCosts(lineVersion : EMPWPCLine) {
    // use the BICCodes for Submission
    var bicCodes = lineVersion.BICCodes
    var empwpccov = lineVersion.EMPWPCCovs.first()

    if (bicCodes != null) {
      var cuItems = empwpccov.WorkAccountLevyCosts

      // Remove all unecessary CUs
      var cuCode = bicCodes.map(\c -> c.CUCode).toSet()
      var removeCUs = cuItems.where(\elt -> !cuCode.contains(elt.Code) and elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
      if(removeCUs.length > 0) {
        for (cuToRemove in removeCUs) {
          cuToRemove.removeWM()
        }
      }

      if(cuItems.length > 0) {
        for (cuItem in cuItems) {
          cuItem.AdjustedLiableEarnings = new CurrencyAmount(0, Currency.TC_NZD)
        }
      }

      //Roll up the earnings
      for (bicCode in bicCodes) {
        // Check if the cuItems already contains the CU Code
        var foundCU = empwpccov.WorkAccountLevyCosts.where(\elt -> elt.Code.equals(bicCode.CUCode)).first()
        if (foundCU == null) {
          // Create a new CU Item
          // Convert the BIC Code to a work account cost item
          var cuItem = new EMPWorkAccountLevyCostItem(lineVersion.Branch)
          cuItem.setCode(bicCode.CUCode)
          cuItem.setDescription(bicCode.CUDescription)
          cuItem.setAdjustedLiableEarnings(bicCode.AdjustedLiableEarnings)
          cuItem.setCostType(WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
          empwpccov.addToWorkAccountLevyCosts(cuItem)
        } else {
          // roll up the costs
          var totalCosts = foundCU.AdjustedLiableEarnings + bicCode.AdjustedLiableEarnings
          foundCU.AdjustedLiableEarnings = totalCosts
        }
      }
    }
  }

  private function rateResidualWorkAccountLevyCosts(lineVersion : EMPWPCLine) {
    var bicCodes = lineVersion.BICCodes
    var empwpccov = lineVersion.EMPWPCCovs.first()
    var isSlice = lineVersion.isSlice()
    if (bicCodes != null) {
      var cuItems = empwpccov.ResidualWorkAccountLevyCosts

      // Remove all unecessary CUs
      var cuCode = bicCodes.map(\c -> c.CUCode).toSet()
      var removeCUs = cuItems.where(\elt -> !cuCode.contains(elt.Code))
      if(removeCUs.length > 0) {
        for (cuToRemove in removeCUs) {
          cuToRemove.removeWM()
        }
      }

      if(cuItems.length > 0) {
        for (cuItem in cuItems) {
          cuItem.AdjustedLiableEarnings = new CurrencyAmount(0, Currency.TC_NZD)
        }
      }

      for (bicCode in bicCodes) {
        // Check if the cuItems already contains the CU Code
        var foundCU = empwpccov.ResidualWorkAccountLevyCosts.where(\elt -> elt.Code.equals(bicCode.CUCode)).first()
        if (foundCU == null) {
          // Create a new CU Item
          // Convert the BIC Code to a residual work account cost item
          var cuItem = new EMPWorkAccountLevyCostItem(lineVersion.Branch)
          cuItem.setCode(bicCode.CUCode)
          cuItem.setDescription(bicCode.CUDescription)
          cuItem.setAdjustedLiableEarnings(bicCode.AdjustedLiableEarnings)
          cuItem.setCostType(WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
          empwpccov.addToResidualWorkAccountLevyCosts(cuItem)
        } else {
          // roll up the costs
          var totalCosts = foundCU.AdjustedLiableEarnings + bicCode.AdjustedLiableEarnings
          foundCU.AdjustedLiableEarnings = totalCosts
        }
      }
    }
  }

  private function rateWorkAccountLevy(lineVersion : productmodel.EMPWPCLine, proRataFactor:BigDecimal) {
    var totalLevyAmount = BigDecimal.ZERO
    if (lineVersion == null ) {
      var msg = "Failed to rate the Work Account Levy."
      throw new IllegalArgumentException(msg)
    }

    // create an empty CostData -- amounts will be filled in by the rate routine

    var effectiveDate = PolicyLine.EffectiveDate
    var empwpccov = lineVersion.EMPWPCCovs.first()

    // iterate through CU Items and rate each one
    for (cuCode in empwpccov.WorkAccountLevyCosts.where(\elt -> elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)) {

      var data = createEMPWorkAccountLevyItemCostData(empwpccov, cuCode, ChargePattern.TC_WAL)
      var existingCost = data.getExistingCost(lineVersion)
      data.Basis = cuCode.AdjustedLiableEarnings.Amount

      // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
      // into the routine so it can do rate capping.
      var priorCov = lineVersion.BasedOn
      while (priorCov != null and priorCov.Branch.PolicyTerm == lineVersion.Branch.PolicyTerm) {
        priorCov = priorCov.BasedOn
      }

      var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
          {TC_POLICYLINE      -> PolicyLine,
              TC_TAXABLEBASIS -> data.Basis,
              TC_CLASSIFICATIONUNIT -> cuCode.Code,
              TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate,
              TC_ER_OR_NCD                -> BigDecimal.ZERO,
              TC_WSD_OR_WSMP   -> BigDecimal.ZERO}

      RateBook.executeCalcRoutine(WORK_ACCOUNT_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
          :paramSet = rateRoutineParameterMap)

      data.StandardAmount = data.StandardTermAmount * proRataFactor
      data.copyStandardColumnsToActualColumns()
      if(data.Overridable) {
        performOverride(existingCost, data)
      }

      if(Audit) {
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

      if(ERStatus == ERStatus_ACC.TC_ER_MODIFIER_PENDING or
          ERStatus == ERStatus_ACC.TC_NEXT_TERM_ER_MODIFIER_PENDING or
          checkForPremiumThresholdOverried() or
          checkForERModifierOverride()) {
        totalLevyAmount += data.StandardAmount
      } else {
        totalLevyAmount += data.ActualAmount
      }
    }

    var effectDatesList = createPolicyEffectiveDates()
    totalLevyAmount += rateERModifier(totalLevyAmount, lineVersion, lineVersion.EMPLineModifiers,
        Funxion.buildProcessor(new CancelProrataFactor()).process(proRataFactor))
    rateDiscountAppliedModifiers(totalLevyAmount, lineVersion, lineVersion.EMPLineModifiers, effectDatesList)
  }

  private function rateResidualWorkAccountLevy(lineVersion : productmodel.EMPWPCLine, proRataFactor:BigDecimal) {
    if (lineVersion == null ) {
      var msg = "Failed to rate the Work Account Levy."
      throw new IllegalArgumentException(msg)
    }

    // create an empty CostData -- amounts will be filled in by the rate routine

    var effectiveDate = PolicyLine.EffectiveDate
    var empwpccov = lineVersion.EMPWPCCovs.first()

    // iterate through CU Items and rate each one
    for (cuCode in empwpccov.ResidualWorkAccountLevyCosts.where(\elt -> elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)) {

      var data = createEMPResidualWorkAccountLevyItemCostData(empwpccov, cuCode, ChargePattern.TC_WARP)
      var existingCost = data.getExistingCost(lineVersion)
      data.Basis = cuCode.AdjustedLiableEarnings.Amount

      // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
      // into the routine so it can do rate capping.
      var priorCov = lineVersion.BasedOn
      while (priorCov != null and priorCov.Branch.PolicyTerm == lineVersion.Branch.PolicyTerm) {
        priorCov = priorCov.BasedOn
      }

      var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
          {TC_POLICYLINE      -> PolicyLine,
              TC_TAXABLEBASIS -> data.Basis,
              TC_CLASSIFICATIONUNIT -> cuCode.Code,
              TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate}

      RateBook.executeCalcRoutine(WORK_RESIDUAL_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
          :paramSet = rateRoutineParameterMap)

      data.StandardAmount = data.StandardTermAmount * proRataFactor
      data.copyStandardColumnsToActualColumns()
      if(data.Overridable) {
        performOverride(existingCost, data)
      }

      if(Audit) {
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
  }

  protected function computeTermAmount(costData : CostData, rate : BigDecimal, asPercentage : boolean) : BigDecimal {
    return (costData.Basis * rate / (asPercentage ? 100 : 1)).setScale(2, this.RoundingMode)
  }

  private function createEMPWorkAccountLevyItemCostData(empwpccov:EMPWPCCov, costItem:EMPWorkAccountLevyCostItem, chargePattern:ChargePattern) : EMPWorkAccountLevyItemCostData {
    var start = empwpccov.SliceDate
    var end = getNextSliceDateAfter(start)

    var costItemData = new EMPWorkAccountLevyItemCostData(start, end, empwpccov.getPreferredCoverageCurrency(), RateCache, empwpccov.FixedId, costItem.FixedId)

    costItemData.RateBook = RateBook
    costItemData.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    costItemData.ChargePattern = chargePattern
    costItemData.RoundingLevel = 2

    return costItemData
  }

  private function createEMPResidualWorkAccountLevyItemCostData(empwpccov:EMPWPCCov, costItem:EMPWorkAccountLevyCostItem, chargePattern:ChargePattern) : EMPResidualWorkAccountLevyItemCostData {
    var start = empwpccov.SliceDate
    var end = getNextSliceDateAfter(start)

    var costItemData = new EMPResidualWorkAccountLevyItemCostData(start, end, empwpccov.getPreferredCoverageCurrency(), RateCache, empwpccov.FixedId, costItem.FixedId)
    costItemData.RateBook = RateBook
    costItemData.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    costItemData.ChargePattern = chargePattern
    costItemData.RoundingLevel = 2

    return costItemData
  }

  private function rateWorkingSaferLevy(lineVersion : productmodel.EMPWPCLine, proRataFactor:BigDecimal) {
    if (lineVersion == null ) {
      throw new IllegalArgumentException("Failed to rate.")
    }

    var empwpccov = lineVersion.EMPWPCCovs.first()

    // create an empty CostData -- amounts will be filled in by the rate routine
    var start = empwpccov.SliceDate
    var end = getNextSliceDateAfter(start)
    var data = new EMPWorkingSaferLevyCostData(start, end, empwpccov.getPreferredCoverageCurrency(), RateCache, empwpccov.FixedId)
    var existingCost = data.getExistingCost(lineVersion)

    var effectiveDate = PolicyLine.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern = ChargePattern.TC_WSL
    data.RoundingLevel = 2

    var taxableCost = empwpccov.LiableEarningCov.TotalLiableEarnings.Amount

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = empwpccov.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == empwpccov.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE      -> PolicyLine,
            TC_TAXABLEBASIS -> taxableCost,
            TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate}

    // Working Safer Levy
    RateBook.executeCalcRoutine(WORKING_SAFER_LEVY_RATE_ROUTINE, :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.StandardAmount = data.StandardTermAmount * proRataFactor

    data.copyStandardColumnsToActualColumns()
    if(data.Overridable) {
      performOverride(existingCost, data)
    }

    if(Audit) {
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
  override protected function rateWindow(line: EMPWPCLine) {
    var logMsg = "Rating across policy term..."
    if (_rfLogger.DebugEnabled) {
      _rfLogger.debug(logMsg)
    }

    assertSliceMode(line)

    /***********
     *
     * Rating logic for rating 1 slice of the line goes here
     *
     ***********/
    // This determines what set of BIC codes to use: BICCodes for Submission and AuditedBICCodes for Audit
    this.Audit = line.JobType == typekey.Job.TC_AUDIT

    var period = line.AssociatedPolicyPeriod

    Funxion.buildExecutor(new NextTermModifierOverrideHandler(period)).execute(OverrideHandler)

    // Rate line-level coverages per vehicle
    rateWorkAccountLevyCosts(line)
    if (Audit and DateUtil_ACC.isDatePriorACCWorkResidualLevyEndDate(PolicyLine.getAssociatedPolicyPeriod().PeriodEnd)) {
      rateResidualWorkAccountLevyCosts(line)
    }

    line.EMPWPCCovs.first().ProRataFactor = ProRationUtil_ACC.getProRataFactor(period)

    rateWorkAccountLevy(line, line.EMPWPCCovs.first().ProRataFactor)
    // Calculation on Audit
    if (Audit) {

      rateWorkingSaferLevy(line, line.EMPWPCCovs.first().ProRataFactor)
      if(DateUtil_ACC.isDatePriorACCWorkResidualLevyEndDate(PolicyLine.getAssociatedPolicyPeriod().PeriodEnd)) {
        rateResidualWorkAccountLevy(line, line.EMPWPCCovs.first().ProRataFactor)
      }
    }

    calculateGST()

    clearOverrideAndApplyToActual()

    if (_rfLogger.DebugEnabled) {
      _rfLogger.debug(logMsg + " done")
    }
  }

  // Used by the extractCostDatasFromExistingCosts method.  Must be implemented if that method is going to be called
  override protected function createCostDataForCost(c: Cost): CostData {
    var cd: CostData

    switch (typeof c) {
      case EMPWorkAccountLevyCost:
        cd = new EMPWorkAccountLevyCostData(c, RateCache)
        break
      case EMPResidualWorkAccountLevyCost:
        cd = new EMPResidualWorkAccountLevyCostData(c, RateCache)
        break
      case EMPWorkingSaferLevyCost:
        cd = new EMPWorkingSaferLevyCostData(c, RateCache)
        break
      case EMPWPCLiableEarningsCost:
        cd = new EMPWPCLiableEarningsCostData(c, RateCache)
        break
      case EMPWorkAccountLevyItemCost:
        cd = new EMPWorkAccountLevyItemCostData(c, RateCache)
        break
      case EMPWPCModifierCost:
        cd = new EMPModifierCostData(c, RateCache)
        break
      case EMPTaxCost:
        cd = new EMPTaxCostData(c, RateCache)
        break
      default:
        throw "Unexpected cost type ${c.DisplayName}"
    }
    return cd
  }

  protected override function createDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return new EMPTaxCostData(Branch.PeriodStart, Branch.PeriodEnd, TaxRatingCurrency, RateCache, ChargePattern.TC_GST)
  }

  protected override function createNonDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return new EMPTaxCostData(Branch.PeriodStart, Branch.PeriodEnd, TaxRatingCurrency, RateCache)
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifier: Key, modifierDate: Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    var costData = new EMPModifierCostData(effDate, expDate, coveredItemID, modifier, modifierDate)
    costData.ChargePattern = ChargePattern.TC_WAL
    return costData
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifier: Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    var costData = new EMPModifierCostData(effDate, expDate, coveredItemID, modifier)
    costData.ChargePattern = ChargePattern.TC_WAL
    return costData
  }

  override function getProvisionalModifierCosts(): Cost[] {
    return PolicyLine.EMPCosts.where(\elt -> elt typeis EMPWPCModifierCost)
  }

  /******
   * This default version of this method will return all of the Costs on a policy for the slice's effective date.  If some of the
   * costs on a policy are created as part of the "rate window" portion of the rating algorithm (that is, they are created at the
   * end for the entire period rather than created as part of rating each slice in time), then these costs should be excluded
   * from what is returned by this method.  Override this method to return only the types of costs that would be created during the
   * rateSlice portion of the algorithm in that case.
   ******/
  override protected function existingSliceModeCosts(): Iterable<Cost> {
    return PolicyLine.Costs.where(\c -> c typeis EMPWPCLiableEarningsCost)
  }

  override property get NumDaysInCoverageRatedTerm(): int {
    var prorater = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    var endDate = Plugins.get(IPolicyTermPlugin).calculatePeriodEnd(Branch.StartOfRatedTerm, Branch.Policy.Product.DefaultTermType, Branch)
    return prorater.financialDaysBetween(endDate, Branch.StartOfRatedTerm)
  }

  /**
   * Update cost with migration values. This is executed for migration transactions
   */
  override function updateDataMigrationCosts(lineVersion: EMPWPCLine) {
    if (_LOG.DebugEnabled) {
      _LOG.debug(_LOG_TAG + "updateDataMigrationCosts enter")
    }

    // get migrated costs and apply
    if (not (lineVersion.Branch.IsAEPMigration and hasUpdateAEPDataMigrationCosts(lineVersion))) {
      for (migrationEMPCost in lineVersion.MigrationEMPCosts) {
        createCostData(lineVersion, migrationEMPCost, null)
        lineVersion.removeFromMigrationEMPCosts(migrationEMPCost)
      }
      for (empwpccov in lineVersion.EMPWPCCovs) {
        for (migrationEMPCost in empwpccov.MigrationEMPCosts) {
          createCostData(lineVersion, migrationEMPCost, empwpccov)
          empwpccov.removeFromMigrationEMPCosts(migrationEMPCost)
        }
      }
    }

    if (_LOG.DebugEnabled) _LOG.debug(_LOG_TAG + "updateDataMigrationCosts exit")
  }

  private function createCostData(lineVersion: entity.EMPWPCLine, migrationEMPCost: MigrationEMPCostInfo_ACC, empwpccov: EMPWPCCov) {
    var policyLine = lineVersion.getSlice(Branch.PeriodStart)
    // find cost of this type
    var cost: entity.EMPCost
    foreach(empcost in policyLine.EMPCosts) {
      // only one cost for each type in migration
      if (empcost.Subtype == migrationEMPCost.EMPCostSubtype) {
        if(empcost typeis EMPResidualWorkAccountLevyItemCost) {
          if(empcost.ResWorkAccountLevyCostItem.Code == migrationEMPCost.cuCode) {
            cost = empcost
            break
          }
        } else if(empcost typeis EMPWPCModifierCost) {
          if(empcost.Modifier.PatternCode == migrationEMPCost.ModifierPattern) {
            cost = empcost
            break
          }
        } else if(empcost.Code == migrationEMPCost.cuCode) {
          cost = empcost
          break
        }
      }
    }

    // just create a new one
    if(cost == null) {
      switch(migrationEMPCost.EMPCostSubtype) {
        case typekey.EMPCost.TC_EMPTAXCOST:
          cost = new EMPTaxCost(Branch)
          break
        case typekey.EMPCost.TC_EMPWPCLIABLEEARNINGSCOST:
          cost = new EMPWPCLiableEarningsCost(Branch)
          break
        case typekey.EMPCost.TC_EMPRESIDUALWORKACCOUNTLEVYITEMCOST:
          cost = new EMPResidualWorkAccountLevyItemCost(Branch)
          break
        case typekey.EMPCost.TC_EMPWORKACCOUNTLEVYITEMCOST:
          cost = new EMPWorkAccountLevyItemCost(Branch)
          break
        case typekey.EMPCost.TC_EMPWORKINGSAFERLEVYCOST:
          cost = new EMPWorkingSaferLevyCost(Branch)
          break
        case typekey.EMPCost.TC_EMPWPCMODIFIERCOST:
          cost = new EMPWPCModifierCost(Branch)
          break
        default:
          throw "Unexpected cost type ${migrationEMPCost.EMPCostSubtype.DisplayName}"
      }

    }

    // set parents
    cost.setEMPWPCLine(lineVersion)
    if(cost typeis EMPWPCLiableEarningsCost) {
      cost.EMPWPCCov = empwpccov
    }

    // set some type specific fields
    switch (typeof cost) {
      case EMPWPCModifierCost:
        var modifier = policyLine.EMPLineModifiers.firstWhere(\elt -> elt.PatternCode == migrationEMPCost.ModifierPattern)
        cost.Modifier = modifier
        break
      case EMPResidualWorkAccountLevyItemCost:
        cost.ResWorkAccountLevyCostItem = policyLine.EMPWPCCovs.first().ResidualWorkAccountLevyCosts.firstWhere(\elt -> elt.Code == migrationEMPCost.cuCode)
        break
      case EMPWorkAccountLevyItemCost:
        cost.EMPWorkAccountLevyCostItem = policyLine.EMPWPCCovs.first().WorkAccountLevyCosts.firstWhere(\elt -> elt.Code == migrationEMPCost.cuCode)
        break
    }


    // set migrated values
    cost.setActualAmountBilling(migrationEMPCost.ActualTermAmount)
    cost.setActualTermAmountBilling(migrationEMPCost.ActualTermAmount)
    cost.setStandardAmountBilling(migrationEMPCost.ActualTermAmount)
    cost.setStandardTermAmountBilling(migrationEMPCost.ActualTermAmount)

    cost.setActualAmount(migrationEMPCost.ActualTermAmount)
    cost.setActualTermAmount(migrationEMPCost.ActualTermAmount)
    cost.setStandardAmount(migrationEMPCost.ActualTermAmount)
    cost.setStandardTermAmount(migrationEMPCost.ActualTermAmount)

    cost.setActualAdjRate(migrationEMPCost.ActualAdjRate)
    cost.setActualBaseRate(migrationEMPCost.ActualAdjRate)

    cost.setChargePattern(migrationEMPCost.ChargePattern)
    cost.setBasis(migrationEMPCost.Basis)
    cost.setRoundingLevel(migrationEMPCost.RoundingLevel)
    cost.setRateAmountType(migrationEMPCost.RateAmountType)
    cost.setNumDaysInRatedTerm(migrationEMPCost.NumDaysInRatedTerm)
    cost.setEffectiveDate(Branch.PeriodStart)
    cost.setExpirationDate(Branch.PeriodEnd)
    cost.setOverrideSource(OverrideSourceType.TC_RENEWALCAP)

    // cost data
    // this is just slightly different than createCostDataForCost
    var costData: EMPCostData
    switch (typeof cost) {
      case EMPTaxCost:
        costData = new EMPTaxCostData(cost)
        break
      case EMPWPCLiableEarningsCost:
        costData = new EMPWPCLiableEarningsCostData(cost)
        break
      case EMPResidualWorkAccountLevyItemCost:
        costData = new EMPResidualWorkAccountLevyItemCostData(cost)
        break
      case EMPWorkAccountLevyItemCost:
        costData = new EMPWorkAccountLevyItemCostData(cost)
        break
      case EMPWorkingSaferLevyCost:
        costData = new EMPWorkingSaferLevyCostData(cost)
        break
      case EMPWPCModifierCost:
        costData = new EMPModifierCostData(cost)
        break
      default:
        throw "Unexpected cost type ${cost.DisplayName}"
    }

    // set migrated values
    costData.ActualAmountBilling = migrationEMPCost.ActualTermAmount
    costData.ActualTermAmountBilling = migrationEMPCost.ActualTermAmount
    costData.StandardAmountBilling = migrationEMPCost.ActualTermAmount
    costData.StandardTermAmountBilling = migrationEMPCost.ActualTermAmount

    costData.ActualAmount = migrationEMPCost.ActualTermAmount
    costData.ActualTermAmount = migrationEMPCost.ActualTermAmount
    costData.StandardAmount = migrationEMPCost.ActualTermAmount
    costData.StandardTermAmount = migrationEMPCost.ActualTermAmount

    costData.ActualAdjRate = migrationEMPCost.ActualAdjRate
    costData.ActualBaseRate = migrationEMPCost.ActualAdjRate

    costData.ChargePattern = migrationEMPCost.ChargePattern
    costData.Basis = migrationEMPCost.Basis
    costData.RoundingLevel = migrationEMPCost.RoundingLevel
    costData.RateAmountType = migrationEMPCost.RateAmountType
    costData.NumDaysInRatedTerm = migrationEMPCost.NumDaysInRatedTerm
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

  function hasUpdateAEPDataMigrationCosts(lineVersion: EMPWPCLine) : boolean {
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
        lineVersionWithMigrationCosts = lineVersion.Branch.BasedOn.EMPWPCLine
        lineVersion.Branch.TotalPremiumRPT = aepMigrationInfo.TotalPremiumRPT
        lineVersion.Branch.TotalCostRPT = aepMigrationInfo.TotalCostRPT
      } else if (aepMigrationInfo.AEPMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_EXIT and
          lineVersion.Branch.Job typeis RewriteNewAccount) {
        lineVersionWithMigrationCosts = lineVersion.Branch.Policy.RewrittenToNewAccountSource
                                                                 .RewrittenToNewAccountSource
                                                                 .Periods.firstWhere(\pp -> pp.Job typeis Submission).EMPWPCLine
        lineVersion.Branch.TotalPremiumRPT = aepMigrationInfo.TotalPremiumRPT
        lineVersion.Branch.TotalCostRPT = aepMigrationInfo.TotalCostRPT
      }
      else if (lineVersion.Branch.Job typeis Audit) {
        // If audit job, we need to copy costs from the original submission.
        if (aepMigrationInfo.AEPMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_ENTRY) {
          // For mid-term entry, we copy costs from the same policy, so we need to do 2 basedOns to get
          // to cancellation and then submission.
          lineVersionWithMigrationCosts = lineVersion.Branch.BasedOn.BasedOn.EMPWPCLine
          lineVersion.Branch.TotalPremiumRPT = aepMigrationInfo.TotalPremiumRPT
          lineVersion.Branch.TotalCostRPT = aepMigrationInfo.TotalCostRPT
        }
        else if (aepMigrationInfo.AEPMigrationType == AEPMigrationType_ACC.TC_AEP_MID_TERM_EXIT) {
          // For mid-term exit, we need to copy costs from the original policy submission, so we need to go
          // back to the source policy of 2 rewrites in order to get to the submission.
          lineVersionWithMigrationCosts = lineVersion.Branch.Policy.RewrittenToNewAccountSource
                                          .RewrittenToNewAccountSource
                                          .Periods.firstWhere(\pp -> pp.Job typeis Submission).EMPWPCLine
          lineVersion.Branch.TotalPremiumRPT = aepMigrationInfo.TotalPremiumRPT
          lineVersion.Branch.TotalCostRPT = aepMigrationInfo.TotalCostRPT
        }
      }
      // process the migrated cost
      for (migrationEMPCost in lineVersionWithMigrationCosts.MigrationEMPCosts) {
        createCostData(lineVersion, migrationEMPCost, null)
      }
      var currentCov = lineVersion.EMPWPCCovs.first()
      for (empwpccov in lineVersionWithMigrationCosts.EMPWPCCovs) {
        for (migrationEMPCost in empwpccov.MigrationEMPCosts) {
          createCostData(lineVersion, migrationEMPCost, currentCov)
        }
      }
      return true
    }
    return false
  }
}
