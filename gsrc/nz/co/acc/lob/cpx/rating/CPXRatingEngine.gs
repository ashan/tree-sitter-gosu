package nz.co.acc.lob.cpx.rating

uses gw.financials.Prorater
uses gw.lob.util_acc.DiscountsUtil_ACC
uses gw.pl.persistence.core.Key
uses gw.plugin.Plugins
uses gw.plugin.policyperiod.IPolicyTermPlugin
uses gw.rating.CostData
uses gw.rating.CostDataWithOverrideSupport
uses gw.rating.RateFlowLogger
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.util.ProRationUtil_ACC
uses nz.co.acc.migration.rating.AbstractMigrationRatingEngine_ACC
uses typekey.*

uses java.math.BigDecimal
uses java.math.RoundingMode

class CPXRatingEngine extends AbstractMigrationRatingEngine_ACC<INDCPXLine> {

  static var _LOG = StructuredLogger.CONFIG.withClass(CPXRatingEngine)
  static var _LOG_TAG = "${AbstractMigrationRatingEngine_ACC.Type.RelativeName} - "

  var _baseRatingDate: Date
  var _uwCompanyRateFactor: BigDecimal

  construct(line: INDCPXLine) {
    this(line, RateBookStatus.TC_ACTIVE)
  }

  construct(line: INDCPXLine, minimumRatingLevel: RateBookStatus) {
    super(line, minimumRatingLevel)
    _baseRatingDate = line.Branch.RateAsOfDate
    _uwCompanyRateFactor = line.Branch.getUWCompanyRateFactor(_baseRatingDate, _jurisdiction)
    _minimumRatingLevel = minimumRatingLevel
  }

  override protected function rateSlice(lineVersion: INDCPXLine) {
    assertSliceMode(lineVersion)

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
  override protected function rateWindow(line: INDCPXLine) {
    var logMsg = "Rating across policy term..."
    if (_logger.DebugEnabled) {
      _logger.debug(logMsg)
    }

    if (line.Branch.isCanceledSlice()) {
      // Do nothing if this is a canceled slice
    } else {
      var sliceStart = line.SliceDate
      var sliceEnd = getNextSliceDateAfter(sliceStart)

      /***********
       *
       * Rating logic for rating 1 slice of the line goes here
       *
       ***********/
      //Rate Work Account Levy Costs
      rateWorkAccountLevyCosts(line.INDCPXCovs.first())

      for(cpxEarnings in line.INDCPXCovs.first().CPXInfoCovs) {
        if(cpxEarnings.ProRataFactor > BigDecimal.ZERO) {
          // Rate line-level coverages
          rateCPXEarnersLevy(cpxEarnings)
          rateWorkAccountLevy(cpxEarnings)
          // Rate line-level coverages
          if(line.AssociatedPolicyPeriod.LevyYear_ACC >= ScriptParameters.WorkingSaferStartLevyYear_ACC) {
            rateWorkingSaferLevy(cpxEarnings)
          }
        }
      }
    }

    calculateGST()

    if (_logger.DebugEnabled) {
      _logger.debug(logMsg + " done")
    }
  }

  // Used by the extractCostDatasFromExistingCosts method.  Must be implemented if that method is going to be called
  override protected function createCostDataForCost(c: Cost): CostData {
    var cd: CostData

    switch (typeof c) {
      case INDCPXEarnersLevyCost:
        cd = new INDCPXEarnersLevyCostData(c, RateCache)
        break
      case INDCPXWorkAccountLevyCost:
        cd = new INDCPXWorkAccountLevyCostData(c, RateCache)
        break
      case INDCPXLiableCost:
        cd = new INDCPXLiableCostData(c, RateCache)
        break
      case INDCPXTaxCost:
        cd = new CPXTaxCostData_ACC(c, RateCache)
        break
      case CPXModifierCost:
        cd = new CPXModifierCostData(c, RateCache)
        break
      default:
        throw "Unexpected cost type ${c.DisplayName}"
    }
    return cd
  }

  protected override function createDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return new CPXTaxCostData_ACC(Branch.PeriodStart, Branch.PeriodEnd, TaxRatingCurrency, RateCache)
  }

  protected override function createNonDeductibleTaxCostData(): CostData<Cost, PolicyLine> {
    return new CPXTaxCostData_ACC(Branch.PeriodStart, Branch.PeriodEnd, TaxRatingCurrency, RateCache)
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifierID: Key, modifierDate: Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    return null
  }

  override function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifier: Key): CostDataWithOverrideSupport<Cost, PolicyLine> {
    return null
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
    return PolicyLine.Costs
  }

  protected property get RoundingLevel(): int {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingLevel
  }

  protected property get RoundingMode(): RoundingMode {
    return PolicyLine.Branch.Policy.Product.QuoteRoundingMode
  }

  override property get NumDaysInCoverageRatedTerm(): int {
    var prorater = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    var endDate = Plugins.get(IPolicyTermPlugin).calculatePeriodEnd(Branch.StartOfRatedTerm, Branch.Policy.Product.DefaultTermType, Branch)
    return prorater.financialDaysBetween(endDate, Branch.StartOfRatedTerm)
  }

  private function rateCPXEarnersLevy(cpxEarnings : CPXInfoCov_ACC) {
    if (cpxEarnings == null ) {
      throw new IllegalArgumentException("Failed to rate Earners Levy.")
    }

    var start = cpxEarnings.SliceDate
    var end = getNextSliceDateAfter(start)
    var data = new INDCPXEarnersLevyCostData(start, end, cpxEarnings.Branch.PreferredCoverageCurrency, RateCache, cpxEarnings.INDCPXCov.FixedId, cpxEarnings.FixedId)
    var existingCost = data.getExistingCost(PolicyLine)
    var effectiveDate = PolicyLine.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern      = ChargePattern.TC_EL_CPX
    data.RoundingLevel      = 2

    //The input parameter to the rate routine for CPX is the agreed level of cover (compensation)
    var taxableCost = cpxEarnings.AgreedLevelOfCover as BigDecimal

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cpxEarnings.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cpxEarnings.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE      -> PolicyLine,
         TC_TAXABLEBASIS -> taxableCost,
         TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate,
         TC_CPXINFOCOV -> cpxEarnings }

    // Earners Levy
    RateBook.executeCalcRoutine(CPX_EARNERS_LEVY_RATE_ROUTINE , :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    data.StandardAmount = data.StandardTermAmount * cpxEarnings.ProRataFactor
    data.ActualAmount = data.StandardAmount
    if(data.Overridable) {
      data.copyOverridesFromCost(existingCost)
      //computeValuesFromCostOverrides(existingCost, data, true)
    }

    if (_logger.DebugEnabled) {
      _logger.debug("Rate CPX LE Coverage")
      _logger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
      _logger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
      _logger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
    }

    // call addCost() to add the new cost to the collection
    addCost(data)
  }

  private function rateWorkingSaferLevy(cpxEarnings : CPXInfoCov_ACC) {
    if (cpxEarnings == null ) {
      throw new IllegalArgumentException("Failed to rate Working Safer Levy.")
    }

    var start = cpxEarnings.SliceDate
    var end = getNextSliceDateAfter(start)
    var data = new INDCPXWorkingSaferLevyCostData(start, end, cpxEarnings.Branch.PreferredCoverageCurrency, RateCache, cpxEarnings.INDCPXCov.FixedId, cpxEarnings.FixedId)
    var existingCost = data.getExistingCost(PolicyLine)
    var effectiveDate = PolicyLine.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern      = ChargePattern.TC_WSL_CPX
    data.RoundingLevel      = 2

    //The input parameter to the rate routine for CPX is the agreed level of cover (compensation)
    var taxableCost = cpxEarnings.AgreedLevelOfCover as BigDecimal

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cpxEarnings.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cpxEarnings.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE      -> PolicyLine,
            TC_TAXABLEBASIS -> taxableCost,
            TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate}

    // Earners Levy
    RateBook.executeCalcRoutine(WORKING_SAFER_LEVY_RATE_ROUTINE , :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    data.StandardAmount = data.StandardTermAmount * cpxEarnings.ProRataFactor
    data.ActualAmount = data.StandardAmount
    if(data.Overridable) {
      data.copyOverridesFromCost(existingCost)
      //computeValuesFromCostOverrides(existingCost, data, true)
    }

    if (_logger.DebugEnabled) {
      _logger.debug("Rate CPX LE Coverage")
      _logger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
      _logger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
      _logger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
    }

    // call addCost() to add the new cost to the collection
    addCost(data)
  }


  private function rateWorkAccountLevy(cpxEarnings : CPXInfoCov_ACC) {

    if (cpxEarnings == null ) {
      throw new IllegalArgumentException("Failed to rate CPX Work Account Levy.")
    }

    var cuItem = cpxEarnings.Branch.INDCPXLine.INDCPXCovs.first().WorkAccountLevyCosts.firstWhere(\elt -> elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
    var data = createINDCPXWorkAccountLevyCostData(cpxEarnings.INDCPXCov, cpxEarnings, cpxEarnings.Branch.PreferredCoverageCurrency, cuItem)
    var existingCost = data.getExistingCost(PolicyLine)
    var effectiveDate = PolicyLine.EffectiveDate
    data.RateBook = RateBook
    data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    data.ChargePattern = ChargePattern.TC_WAL_CPX
    data.RoundingLevel      = 2

    //The input parameter to the rate routine for CPX is the agreed level of cover (compensation)
    var taxableCost = cpxEarnings.AgreedLevelOfCover as BigDecimal
    var cpxStandard = cpxEarnings.CoverTypeStandard

    // If we are quoting a renewed term, find the cost on the prior term, and pass its ActualTermAmount
    // into the routine so it can do rate capping.
    var priorCov = cpxEarnings.BasedOn
    while (priorCov != null and priorCov.Branch.PolicyTerm == cpxEarnings.Branch.PolicyTerm) {
      priorCov = priorCov.BasedOn
    }

    var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
        {TC_POLICYLINE      -> PolicyLine,
            TC_TAXABLEBASIS -> taxableCost,
            TC_CLASSIFICATIONUNIT -> cuItem.Code,
            TC_LEVYRATEEFFECTIVEDATE        -> effectiveDate,
            TC_ER_OR_NCD                -> BigDecimal.ZERO,
            TC_WSD_OR_WSMP   -> BigDecimal.ZERO,
            TC_CPXSTANDARD -> cpxStandard}

    RateBook.executeCalcRoutine(CPX_WORK_ACCOUNT_LEVY_RATE_ROUTINE , :costData = data, :worksheetContainer = data,
        :paramSet = rateRoutineParameterMap)

    data.copyStandardColumnsToActualColumns()
    data.StandardAmount = data.StandardTermAmount * cpxEarnings.ProRataFactor
    data.ActualAmount = data.StandardAmount
    if(data.Overridable) {
      data.copyOverridesFromCost(existingCost)
      //computeValuesFromCostOverrides(existingCost, data, true)
    }

    if (_logger.DebugEnabled) {
      _logger.debug("Rate LE Coverage")
      _logger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
      _logger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
      _logger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
    }

    // call addCost() to add the new cost to the collection
    addCost(data)

    var cpxModifiers = cpxEarnings.Branch.INDCPXLine.getAssociatedPolicyPeriod().
        getEffectiveDatedFields().getProductModifiers()
    var totalLevyAmount = data.ActualAmount?:data.StandardAmount
    totalLevyAmount += rateERModifier(totalLevyAmount, cpxEarnings.Branch.INDCPXLine, cpxEarnings, cpxModifiers)
    rateDiscountAppliedModifiers(totalLevyAmount, cpxEarnings.Branch.INDCPXLine, cpxModifiers, cpxEarnings)
  }

  protected function rateERModifier(totalLevyAmount:BigDecimal, lineVersion:PolicyLine, cpxEarnings: CPXInfoCov_ACC, modifiers : Modifier[]) : BigDecimal{
    var selectedERModifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme"))

    if(selectedERModifier.TypeKeyModifier != null and !selectedERModifier.TypeKeyModifier.equals("Standard")) {
      var selectedERModifierRate = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeModRate"))
      if(selectedERModifierRate != null and selectedERModifierRate.RateModifier != null) {
        var start = lineVersion.SliceDate
        var end = getNextSliceDateAfter(start)
        var data = new CPXModifierCostData(start, end, PolicyLine.PreferredCoverageCurrency,
                                           RateCache, lineVersion.FixedId, cpxEarnings.FixedId,
                                           selectedERModifier.FixedId)
        var existingCost = data.getExistingCost(PolicyLine)
        data.StandardAdjRate = selectedERModifierRate.RateModifier
        data.StandardBaseRate = data.StandardAdjRate
        data.Basis = totalLevyAmount
        data.StandardTermAmount = data.StandardAdjRate * data.Basis
        data.StandardAmount = data.StandardTermAmount
        data.ChargePattern = ChargePattern.TC_WAL_CPX

        data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
        data.RoundingLevel = 2

        data.copyStandardColumnsToActualColumns()
        if(data.Overridable) {
          data.copyOverridesFromCost(existingCost)
          computeValuesFromCostOverrides(existingCost, data, false)
        }

        if (_logger.DebugEnabled) {
          _logger.debug("Rate LE Coverage")
          _logger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
          _logger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
          _logger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
        }

        // call addCost() to add the new cost to the collection
        addCost(data)
        return data.ActualAmount
      }
    }

    return BigDecimal.ZERO
  }

  protected function rateDiscountAppliedModifiers(totalLevyAmount:BigDecimal, lineVersion:PolicyLine, modifiers : Modifier[], cpxEarnings:CPXInfoCov_ACC) {
    var hasWSMPRated = false
    var modifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.contains("DiscountAppliedWSMPPrimary"))
    hasWSMPRated = rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, DiscountsApplied_ACC.TC_WSMPPRIMARY, cpxEarnings) or hasWSMPRated

    modifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.contains("DiscountAppliedWSMPSecondary"))
    hasWSMPRated = rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, DiscountsApplied_ACC.TC_WSMPSECONDARY, cpxEarnings) or hasWSMPRated

    modifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.contains("DiscountAppliedWSMPTertiary"))
    hasWSMPRated = rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, DiscountsApplied_ACC.TC_WSMPTERTIARY, cpxEarnings) or hasWSMPRated

    modifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.contains("DiscountAppliedWSD"))
    if (hasWSMPRated) {
      rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, DiscountsApplied_ACC.TC_WSD, cpxEarnings)
    } else {
      rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion,
                                  BigDecimal.valueOf(DiscountsUtil_ACC.getPercentage("WSD")), 1, cpxEarnings, null)
    }
  }

  private function rateDiscountAppliedModifier(modifier : Modifier,
                                               totalLevyAmount:BigDecimal,
                                               lineVersion:PolicyLine,
                                               discountAppliedKey:DiscountsApplied_ACC,
                                               cpxEarnings:CPXInfoCov_ACC) : boolean {
    if (modifier != null and modifier.BooleanModifier and modifier.StartEndDate.EffectiveExpirationDate.length > 0) {
      rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion,
                                  BigDecimal.valueOf(DiscountsUtil_ACC.getPercentage(discountAppliedKey.Code)), cpxEarnings)
      return true
    }

    return false
  }

  public function rateDiscountAppliedModifier(modifier:Modifier, totalLevyAmount:BigDecimal, lineVersion: PolicyLine,
                                              rate : BigDecimal, cpxEarnings:CPXInfoCov_ACC) {
    for(modifierDate in modifier.StartEndDate.EffectiveExpirationDate) {
      var result = generateModifierProRataFactor(cpxEarnings, modifierDate)
      if(result > 0) {
        rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, rate, result, cpxEarnings, modifierDate)
      }
    }
  }

  public function rateDiscountAppliedModifier(modifier:Modifier,
                                              totalLevyAmount:BigDecimal,
                                              lineVersion: PolicyLine,
                                              rate : BigDecimal,
                                              proRataFactor:BigDecimal,
                                              cpxEarnings:CPXInfoCov_ACC,
                                              modifierDate:EffectiveExpirationDate_ACC) {
    if(modifier != null and
       modifier.BooleanModifier and
       modifier.StartEndDate.EffectiveExpirationDate.length > 0 and
       proRataFactor > 0) {

      if(modifierDate == null) {
        modifierDate = modifier.StartEndDate.EffectiveExpirationDate.first()
      }

      var start = lineVersion.SliceDate
      var end = getNextSliceDateAfter(start)
      var data = new CPXModifierCostData(start,
                                         end,
                                         PolicyLine.PreferredCoverageCurrency,
                                         RateCache,
                                         lineVersion.FixedId,
                                         cpxEarnings.FixedId,
                                         modifier.FixedId, modifierDate.FixedId)
      var existingCost = data.getExistingCost(PolicyLine)
      data.ChargePattern = ChargePattern.TC_WAL_CPX
      data.Basis = totalLevyAmount
      data.StandardAdjRate = rate.negate()/100
      data.StandardBaseRate = data.StandardAdjRate
      data.StandardTermAmount = data.StandardAdjRate * data.Basis
      data.StandardAmount = data.StandardTermAmount * proRataFactor
      data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
      data.RoundingLevel = 2

      data.copyStandardColumnsToActualColumns()
      if(data.Overridable) {
        data.copyOverridesFromCost(existingCost)
        computeValuesFromCostOverrides(existingCost, data, false)
      }

      if (_logger.DebugEnabled) {
        _logger.debug("Rate Discount")
        _logger.debug("   Standard Base Rate:     ${data.StandardBaseRate}")
        _logger.debug("   Standard Adjusted Rate: ${data.StandardAdjRate}")
        _logger.debug("   Standard Term Amount:   ${data.StandardTermAmount}")
      }

      // call addCost() to add the new cost to the collection
      addCost(data)
    }
  }

  private function generateModifierProRataFactor(cpxEarnings:CPXInfoCov_ACC,
                                                 modifierDate : EffectiveExpirationDate_ACC ) : BigDecimal {
    var proRataFactor = BigDecimal.ZERO
    var policyExpirationDate = PolicyLine.JobType == typekey.Job.TC_CANCELLATION ? PolicyLine.AssociatedPolicyPeriod.CancellationDate :
                                                                                   PolicyLine.ExpirationDate

    if(DateUtil_ACC.isBeforeOrOnSameDay(cpxEarnings.PeriodStart, modifierDate.expirationDate_ACC) and
       DateUtil_ACC.isBeforeDay(modifierDate.effectiveDate_ACC, cpxEarnings.PeriodEnd)) {

      var effectiveDate = cpxEarnings.PeriodStart
      if(effectiveDate.getTime() < modifierDate.effectiveDate_ACC.getTime()) {
        effectiveDate = modifierDate.effectiveDate_ACC
      }

      var expirationDate = cpxEarnings.PeriodEnd
      if(expirationDate.getTime() > modifierDate.expirationDate_ACC.getTime()) {
        expirationDate = modifierDate.expirationDate_ACC
      }

      proRataFactor = ProRationUtil_ACC.calculateProRateFactor(effectiveDate,
                                                               expirationDate,
                                                               cpxEarnings.PeriodStart,
                                                               cpxEarnings.PeriodEnd, policyExpirationDate)
    } else if (DateUtil_ACC.isBeforeDay(cpxEarnings.PeriodStart, modifierDate.expirationDate_ACC) and
              DateUtil_ACC.isAfterDay(modifierDate.effectiveDate_ACC, cpxEarnings.PeriodEnd)) {
      proRataFactor = ProRationUtil_ACC.calculateProRateFactor(modifierDate.effectiveDate_ACC,
                                                               cpxEarnings.PeriodEnd,
                                                               cpxEarnings.PeriodStart,
                                                               cpxEarnings.PeriodEnd, policyExpirationDate)
    }

    return proRataFactor
  }

  private function createINDCPXWorkAccountLevyCostData(effDatedCoverable: EffDated,
                                                       effDatedEarnings: EffDated,
                                                       preferredCurrency:Currency,
                                                       effDatedReference: EffDated) : CPXCostData {
    var start = effDatedCoverable.SliceDate
    var end = getNextSliceDateAfter(start)
    var costItemData : CPXCostData

    costItemData = new INDCPXWorkAccountLevyCostData(start,
                                                     end,
                                                     preferredCurrency,
                                                     RateCache,
                                                     effDatedCoverable.FixedId,
                                                     effDatedEarnings.FixedId, effDatedReference.FixedId)
    costItemData.RateBook = RateBook
    costItemData.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
    costItemData.ChargePattern = ChargePattern.TC_WAL_CPX
    costItemData.RoundingLevel = 2

    return costItemData
  }

  private function rateWorkAccountLevyCosts(coverable: INDCPXCov) {
    // For CPX there is only one BIC code
    var bicCode = coverable.INDCPXLine?.BICCodes?.first()
    var workAccountLevyCosts = coverable.WorkAccountLevyCosts
    var cuItem : INDCPXWorkAccountLevyCostItem

    if(workAccountLevyCosts.length > 0) {
      cuItem = workAccountLevyCosts.firstWhere(\elt -> elt.CostType == WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
      if(cuItem != null and !cuItem.Code.equals(bicCode.CUCode)) {
        cuItem.removeWM()
      }
    }

    if (bicCode != null) {
      // clear the costs
      if(coverable.WorkAccountLevyCosts.length == 0) {
        cuItem = new INDCPXWorkAccountLevyCostItem(coverable.Branch)
        cuItem.setCode(bicCode.CUCode)
        cuItem.setDescription(bicCode.CUDescription)
        cuItem.setCostType(WorkAccountLevyCostType_ACC.TC_CLASSIFICATIONUNIT)
        coverable.addToWorkAccountLevyCosts(cuItem)
      }
    }
  }

  override function updateDataMigrationCosts(lineVersion: INDCPXLine) {
    if (_LOG.DebugEnabled) {
      _LOG.debug(_LOG_TAG + "updateDataMigrationCosts enter")
    }

    // get migrated costs and apply
    for (migrationCPXCost in lineVersion.MigrationCPXCosts) {
      createCostData(lineVersion, migrationCPXCost, null, null)
      lineVersion.removeFromMigrationCPXCosts(migrationCPXCost)
    }
    for (indcpxcov in lineVersion.INDCPXCovs) {
      for (cpxinfocov in indcpxcov.CPXInfoCovs) {
        for (migrationCPXCost in cpxinfocov.MigrationCPXCosts) {
          createCostData(lineVersion, migrationCPXCost, indcpxcov, cpxinfocov)
          cpxinfocov.removeFromMigrationCPXCosts(migrationCPXCost)
        }
      }

      if (_LOG.DebugEnabled) _LOG.debug(_LOG_TAG + "updateDataMigrationCosts exit")
    }
  }

  private function createCostData(lineVersion: entity.INDCPXLine,
                                  migrationCPXCost: MigrationCPXCostInfo_ACC,
                                  indcpxcov: INDCPXCov, cpxinfocov: CPXInfoCov_ACC) {
    var policyLine = lineVersion.getSlice(Branch.PeriodStart)
    // find cost of this type
    var cost: entity.CPXCost
    foreach(cpxCost in policyLine.CPXCosts) {
      if (cpxCost.Subtype == migrationCPXCost.CPXCostSubtype) {
        if (cpxCost typeis CPXModifierCost) {
          if (cpxCost.Modifier.PatternCode == migrationCPXCost.ModifierPattern) {
            cost = cpxCost
            break
          }
        } else {
          cost = cpxCost
          break
        }
      }
    }

    // just create a new one
    if (cost == null) {
      switch (migrationCPXCost.CPXCostSubtype) {
        case typekey.CPXCost.TC_INDCPXTAXCOST:
          cost = new INDCPXTaxCost(Branch)
          break
        case typekey.CPXCost.TC_CPXMODIFIERCOST:
          cost = new CPXModifierCost(Branch)
          break
        case typekey.CPXCost.TC_INDCPXWORKACCOUNTLEVYCOST:
          cost = new INDCPXWorkAccountLevyCost(Branch)
          break
        case typekey.CPXCost.TC_INDCPXEARNERSLEVYCOST:
          cost = new INDCPXEarnersLevyCost(Branch)
          break
        default:
          throw "Unexpected cost type ${migrationCPXCost.CPXCostSubtype.DisplayName}"
      }
    }

    // set parents
    cost.setINDCPXLine(lineVersion)
    if (cost typeis INDCPXLiableCost) {
      cost.INDCPXCov = indcpxcov
      cost.CPXInfoCov = cpxinfocov
    } else if (cost typeis CPXModifierCost) {
      cost.CPXInfoCov = cpxinfocov
    }

    // set some type specific fields

    // not using switch case as we need the type casting
    if (cost typeis CPXModifierCost) {
      var modifier = policyLine.Branch.EffectiveDatedFields.ProductModifiers.firstWhere(\elt -> elt.PatternCode == migrationCPXCost.ModifierPattern)
      cost.Modifier = modifier
    } else if(cost typeis INDCPXWorkAccountLevyCost) {
      cost.WorkAccountLevyCostItem = policyLine.INDCPXCovs.first().WorkAccountLevyCosts.first()
    }


    // set migrated values
    cost.setActualAmountBilling(migrationCPXCost.ActualTermAmount)
    cost.setActualTermAmountBilling(migrationCPXCost.ActualTermAmount)
    cost.setStandardAmountBilling(migrationCPXCost.ActualTermAmount)
    cost.setStandardTermAmountBilling(migrationCPXCost.ActualTermAmount)

    cost.setActualAmount(migrationCPXCost.ActualTermAmount)
    cost.setActualTermAmount(migrationCPXCost.ActualTermAmount)
    cost.setStandardAmount(migrationCPXCost.ActualTermAmount)
    cost.setStandardTermAmount(migrationCPXCost.ActualTermAmount)

    cost.setActualAdjRate(migrationCPXCost.ActualAdjRate)
    cost.setActualBaseRate(migrationCPXCost.ActualAdjRate)

    cost.setChargePattern(migrationCPXCost.ChargePattern)
    cost.setBasis(migrationCPXCost.Basis)
    cost.setRoundingLevel(migrationCPXCost.RoundingLevel)
    cost.setRateAmountType(migrationCPXCost.RateAmountType)
    cost.setNumDaysInRatedTerm(migrationCPXCost.NumDaysInRatedTerm)
    cost.setEffectiveDate(Branch.PeriodStart)
    cost.setExpirationDate(Branch.PeriodEnd)
    cost.setOverrideSource(OverrideSourceType.TC_RENEWALCAP)

    // cost data
    // this is just slightly different than createCostDataForCost
    var costData: CPXCostData
    switch (typeof cost) {
      case INDCPXTaxCost:
        costData = new CPXTaxCostData_ACC(cost)
        break
      case CPXModifierCost:
        costData = new CPXModifierCostData(cost)
        break
      case INDCPXWorkAccountLevyCost:
        costData = new INDCPXWorkAccountLevyCostData(cost)
        break
      case INDCPXEarnersLevyCost:
        costData = new INDCPXEarnersLevyCostData(cost)
        break
      default:
        throw "Unexpected cost type ${cost.DisplayName}"

    }

    // set migrated values
    costData.ActualAmountBilling = migrationCPXCost.ActualTermAmount
    costData.ActualTermAmountBilling = migrationCPXCost.ActualTermAmount
    costData.StandardAmountBilling = migrationCPXCost.ActualTermAmount
    costData.StandardTermAmountBilling = migrationCPXCost.ActualTermAmount

    costData.ActualAmount = migrationCPXCost.ActualTermAmount
    costData.ActualTermAmount = migrationCPXCost.ActualTermAmount
    costData.StandardAmount = migrationCPXCost.ActualTermAmount
    costData.StandardTermAmount = migrationCPXCost.ActualTermAmount

    costData.ActualAdjRate = migrationCPXCost.ActualAdjRate
    costData.ActualBaseRate = migrationCPXCost.ActualAdjRate

    costData.ChargePattern = migrationCPXCost.ChargePattern
    costData.Basis = migrationCPXCost.Basis
    costData.RoundingLevel = migrationCPXCost.RoundingLevel
    costData.RateAmountType = migrationCPXCost.RateAmountType
    costData.NumDaysInRatedTerm = migrationCPXCost.NumDaysInRatedTerm
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
