package nz.co.acc.lob.common.rating

uses entity.*
uses entity.INDCPXLine
uses entity.INDCoPLine
uses gw.lang.reflect.Expando
uses gw.lob.util_acc.DiscountsUtil_ACC
uses gw.pl.persistence.core.Key
uses gw.rating.AbstractRatingEngine
uses gw.rating.CostData
uses gw.rating.CostDataWithOverrideSupport
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses gw.util.Pair
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.common.rating.function.OverrideHandler
uses nz.co.acc.lob.util.ProRationUtil_ACC
uses typekey.*
uses typekey.Job

uses java.math.BigDecimal

/**
 * Abstract rating engine class for the ACC policy lines.
 */
@Export
abstract class AbstractRatingEngine_ACC<PL extends PolicyLine> extends AbstractRatingEngine<PL> {
  protected static final var GST_RATE_ROUTINE : String = "gst_rr"
  protected static final var WORK_ACCOUNT_LEVY_RATE_ROUTINE : String = "work_account_levy_rr"
  protected static final var WORK_RESIDUAL_LEVY_RATE_ROUTINE : String = "work_residual_levy_rr"
  protected static final var WORKING_SAFER_LEVY_RATE_ROUTINE : String = "working_safer_levy_rr"
  protected static final var EARNERS_LEVY_RATE_ROUTINE : String = "earners_levy_rr"
  protected static final var EARNERS_RESIDUAL_LEVY_RATE_ROUTINE : String = "earners_residual_levy_rr"
  protected static final var CPX_WORK_ACCOUNT_LEVY_RATE_ROUTINE : String = "cpx_work_account_levy_rr"
  protected static final var CPX_EARNERS_LEVY_RATE_ROUTINE : String = "cpx_earners_levy_rr"
  protected static final var BULK_FUNDED_HEALTH_LEVY_RATE_ROUTINE : String = "bulk_funded_health_levy_rr"
  protected static final var ADMINISTRATION_FEE_RATE_ROUTINE: String = "administration_fee_levy_rr"
  protected static final var PRIMARY_HEALTH_COST_RATE_ROUTINE: String = "primary_health_levy_rr"
  protected static final var PARTNERSHIP_DISCOUNT_PROGRAMME_RATE_ROUTINE: String = "partnership_discount_programme_levy_rr"
  protected static final var HIGH_CLAIMS_COST_RATE_ROUTINE: String = "high_claims_cost_rr"
  protected static final var STOP_LOSS_LIMIT_COST_RATE_ROUTINE: String = "stop_loss_limit_levy_rr"

  var currentERStatus : ERStatus_ACC = null
  protected var _overrideHandler : OverrideHandler

  protected static var _logger : StructuredLogger_ACC = StructuredLogger.CONFIG.withClass(AbstractRatingEngine)

  /**
   * Constructs a new rating engine instance based around the particular line.
   */
  construct(line : PL, minimumRatingLevel: RateBookStatus) {
    super(line, minimumRatingLevel)
  }

  /**
   * Create the deductible tax cost data for the policy line
   * @return
   */
  abstract protected function createDeductibleTaxCostData() : CostData

  /**
   * Create the non-deductible tax cost data for the policy line
   * @return
   */
  abstract protected function createNonDeductibleTaxCostData() : CostData

  abstract function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifier : Key, modifierDate: Key) : CostDataWithOverrideSupport

  abstract function createModifierCostData(effDate: Date, expDate: Date, coveredItemID: Key, modifier : Key) : CostDataWithOverrideSupport

  abstract function getProvisionalModifierCosts() : Cost[]

  /**
   * Default GST implementation
   */
  protected function calculateGST() {
    if(!(PolicyLine typeis AEPLine) and
       PolicyLine.JobType == typekey.Job.TC_AUDIT and
       ERStatus == ERStatus_ACC.TC_ER_MODIFIER_PENDING) {
      var subTotal = CostDatas.sum(\ c-> c.StandardAmountBilling.Amount)
      // pass true as the default tax cost data is deductible
      calculateGST(subTotal, true)
    } else {
      var subTotal = BigDecimal.ZERO

      if(checkForERModifierOverride() or
         checkForPremiumThresholdOverried()) {
        subTotal = CostDatas.sum(\ c-> c.StandardAmountBilling.Amount)
      } else {
        subTotal = CostDatas.sum(\ c-> c.ActualAmountBilling.Amount)
      }

      // pass true as the default tax cost data is deductible
      calculateGST(subTotal, true)
    }
  }

  protected function checkForERModifierOverride() : boolean {
    if(CostDatas.where(\elt -> elt.OverrideReason != null and (elt.OverrideSource == OverrideSourceType.TC_ER_MODIFIER_PENDING_ACC or
                                                               elt.OverrideSource == OverrideSourceType.TC_NEXT_TERM_ER_MODIFIER_PENDING_ACC) or
                                                              (elt.OverrideReason == ERStatus_ACC.TC_ER_MODIFIER_PENDING.DisplayName or
                                                               elt.OverrideReason == ERStatus_ACC.TC_NEXT_TERM_ER_MODIFIER_PENDING.DisplayName)).size() > 0) {
      return true
    }

    return false
  }

  protected function checkForPremiumThresholdOverried() : boolean {
    if(CostDatas.where(\elt -> elt.OverrideReason != null and
                       (elt.OverrideSource == OverrideSourceType.TC_PREMIUMTHRESHOLD_ACC or
                        elt.OverrideReason == "Below Premium Threshold")).size() > 0) {
      return true
    }

    return false
  }

  property get ERStatus() : ERStatus_ACC {
    if(currentERStatus == null) {
      currentERStatus = PolicyLine.AssociatedPolicyPeriod.PPERStatus_ACC
    }
    return currentERStatus
  }

  /**
   * Calculate GST.
   * @param subTotal - the amount to calculate GST for.
   * @param createDeductibleTaxCostData - if true create a deductible tax cost data, else create a non deductible tax cost data
   */
  protected function calculateGST(subTotal : BigDecimal, createDeductibleTaxCostData : boolean) {

    var cost : CostData = null

    if (createDeductibleTaxCostData) {
      cost = createDeductibleTaxCostData()
    } else {
      cost = createNonDeductibleTaxCostData()
    }

    var existingCost = cost.getExistingCost(PolicyLine)

    if (cost != null) {
      var effectiveDate = PolicyLine.EffectiveDate
      cost.NumDaysInRatedTerm  = PolicyLine.Branch.NumDaysInPeriod
      cost.ChargePattern       = ChargePattern.TC_GST
      cost.RateBook            = RateBook
      cost.RoundingLevel       = 2

      var rateRoutineParameterMap : Map<CalcRoutineParamName, Object> =
          {TC_POLICYLINE      -> PolicyLine,
              TC_TAXABLEBASIS -> subTotal,
              TC_GSTEFFECTIVEDATE        -> effectiveDate}

      // Apply GST
      RateBook.executeCalcRoutine(GST_RATE_ROUTINE, :costData = cost, :worksheetContainer = cost,
          :paramSet = rateRoutineParameterMap)
      cost.StandardAmount = cost.StandardTermAmount
      cost.copyStandardColumnsToActualColumns()
      cost.updateAmountFields(RoundingMode, PolicyLine.Branch.PeriodStart)
      if(cost.Overridable) {
        if(PolicyLine typeis AEPLine or
           PolicyLine typeis INDCPXLine) {
          cost.copyOverridesFromCost(existingCost)
//          computeValuesFromCostOverrides(existingCost, cost, false)
        } else {
          performOverride(existingCost, cost)
        }
      }

      addCost(cost)
    }
  }

  protected function rateERModifier(totalLevyAmount:BigDecimal, lineVersion:PolicyLine, modifiers : Modifier[], proRataFactor:BigDecimal) : BigDecimal {
    var selectedERModifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme"))
    var removeERInAudit = (selectedERModifier.TypeKeyModifier == null and PolicyLine.JobType == Job.TC_AUDIT)
    var normalTransaction = (selectedERModifier.TypeKeyModifier != null and !selectedERModifier.TypeKeyModifier.equals("Standard"))
    if(removeERInAudit or normalTransaction) {
      var selectedRateModifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeModRate"))
      if(removeERInAudit or
         (selectedRateModifier != null and selectedRateModifier.RateModifier != null)) {
          var start = lineVersion.SliceDate
          var end = getNextSliceDateAfter(start)
          var data = createModifierCostData(start, end, lineVersion.FixedId, selectedERModifier.FixedId)
          var existingCost = data.getExistingCost(lineVersion)
          removeERInAudit = existingCost != null or removeERInAudit

          data.StandardAdjRate = selectedRateModifier.RateModifier ?: 0
          data.StandardBaseRate = data.StandardAdjRate ?: 0
          data.Basis = totalLevyAmount ?: 0
          data.StandardTermAmount = (data.StandardAdjRate * data.Basis) ?: 0
          // Don't apply pro-rata factor to Cancellations when joining an AEP
          if (lineVersion.JobType == typekey.Job.TC_CANCELLATION
              and (lineVersion.AssociatedPolicyPeriod.Job as Cancellation).CancelReasonCode == typekey.ReasonCode.TC_JOINEDAEPGROUP_ACC) {
            data.StandardAmount = data.StandardTermAmount ?: 0
          } else {
            data.StandardAmount = (data.StandardTermAmount * proRataFactor) ?: 0
          }
          data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
          data.RoundingLevel = 2
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

          return data.StandardAmount
        }
    }

    return BigDecimal.ZERO
  }

  protected function createPolicyEffectiveDates() : ArrayList<Pair<Date,Date>> {
    var effectDatesList = new ArrayList<Pair<Date, Date>>()

    if(PolicyLine.JobType == typekey.Job.TC_CANCELLATION) {
      effectDatesList.add(new Pair<Date, Date>(PolicyLine.EffectiveDate, PolicyLine.AssociatedPolicyPeriod.CancellationDate))
    } else if ((PolicyLine.JobType == Job.TC_AUDIT)) {
      effectDatesList.add(new Pair<Date, Date>(PolicyLine.AssociatedPolicyPeriod.Audit.AuditInformation.AuditPeriodStartDate,
                                                PolicyLine.AssociatedPolicyPeriod.Audit.AuditInformation.AuditPeriodEndDate))
    } else {
      effectDatesList.add(new Pair<Date, Date>(PolicyLine.EffectiveDate, PolicyLine.ExpirationDate))
    }

    return effectDatesList
  }

  protected function rateDiscountAppliedModifiers(totalLevyAmount:BigDecimal, lineVersion:PolicyLine, modifiers : Modifier[], policyEffectiveDates:List<Pair<Date,Date>>) {
    var hasWSMPRated = false
    var modifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.contains("DiscountAppliedWSMPPrimary"))
    hasWSMPRated = rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, DiscountsApplied_ACC.TC_WSMPPRIMARY, policyEffectiveDates) or hasWSMPRated

    modifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.contains("DiscountAppliedWSMPSecondary"))
    hasWSMPRated = rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, DiscountsApplied_ACC.TC_WSMPSECONDARY, policyEffectiveDates) or hasWSMPRated

    modifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.contains("DiscountAppliedWSMPTertiary"))
    hasWSMPRated = rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, DiscountsApplied_ACC.TC_WSMPTERTIARY, policyEffectiveDates) or hasWSMPRated

    modifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.contains("DiscountAppliedWSD"))

    if(lineVersion typeis INDCoPLine and lineVersion.AssociatedPolicyPeriod.INDCPXLineExists) {
      var fullYearDate : List<Pair<Date,Date>> = new ArrayList<Pair<Date,Date>>()
      fullYearDate.add(new Pair<Date, Date>(lineVersion.EffectiveDate, lineVersion.ExpirationDate))
      hasWSMPRated = hasWSMPModifersApplied(modifiers, fullYearDate) or hasWSMPRated
    }

    if (hasWSMPRated) {
      rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, DiscountsApplied_ACC.TC_WSD, policyEffectiveDates)
    } else{
      rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, BigDecimal.valueOf(DiscountsUtil_ACC.getPercentage("WSD")), 1, policyEffectiveDates, true)
    }
  }

  private function hasWSMPModifersApplied(modifiers : Modifier[], fullYearDate:List<Pair<Date,Date>>) : boolean {
    var hasWSMPRated = false
    hasWSMPRated = modifierHasProRateFactor(modifiers, "DiscountAppliedWSMPPrimary", fullYearDate) or hasWSMPRated
    hasWSMPRated = modifierHasProRateFactor(modifiers, "DiscountAppliedWSMPSecondary", fullYearDate) or hasWSMPRated
    hasWSMPRated = modifierHasProRateFactor(modifiers, "DiscountAppliedWSMPTertiary", fullYearDate) or hasWSMPRated
    return hasWSMPRated
  }

  private function modifierHasProRateFactor(modifiers:Modifier[], modifierName:String, fullYearDate:List<Pair<Date,Date>>) : boolean {
    var modifier = modifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.contains(modifierName))
    if(modifier != null and modifier.BooleanModifier) {
      return checkModifierProRataFactor(modifier, fullYearDate)
    }
    return false
  }

  private function checkModifierProRataFactor(modifier : Modifier, policyEffectiveDates:List<Pair<Date,Date>>) : boolean {
    var proRataFactor = BigDecimal.ZERO
    for (modifierDate in modifier.StartEndDate.EffectiveExpirationDate) {
      proRataFactor = calculateProRateFactor(modifierDate, policyEffectiveDates)
    }
    if (proRataFactor > 0 ) {
      return true
    }
    return false
  }

  private function rateDiscountAppliedModifier(modifier : Modifier,
                                               totalLevyAmount:BigDecimal,
                                               lineVersion:PolicyLine,
                                               discountAppliedKey:DiscountsApplied_ACC,
                                               policyEffectiveDates:List<Pair<Date,Date>>) : boolean{
    if(modifier != null and modifier.BooleanModifier and modifier.StartEndDate.EffectiveExpirationDate.length > 0) {
      rateDiscountAppliedModifier(modifier,
                                  totalLevyAmount,
                                  lineVersion,
                                  BigDecimal.valueOf(DiscountsUtil_ACC.getPercentage(discountAppliedKey.Code)),
                                  -1,
                                  policyEffectiveDates,
                                  false)
      return true
    }

    return false
  }

  public function getCoverPlusEffectiveDates(cpxEarnings: CPXInfoCov_ACC[]) : List<Pair<Date,Date>> {
    var policyEffectiveDates = new ArrayList<Pair<Date, Date>>()
    var previousDate = PolicyLine.EffectiveDate.addDays(-1)
    var policyExpirationDate = PolicyLine.ExpirationDate

    for (policyDate in cpxEarnings.sort()) {
      if(DateUtil_ACC.isBeforeDay(previousDate, policyDate.PeriodStart)) {
        var startDate = previousDate.addDays(1).trimToMidnight()
        var endDate = policyDate.PeriodStart.addDays(-1).trimToMidnight()
        if(endDate.afterOrEqual(startDate)) {
          policyEffectiveDates.add(new Pair<Date, Date>(startDate, endDate))
        }
      }

      previousDate = policyDate.PeriodEnd

      if(DateUtil_ACC.isSameDay(previousDate, policyExpirationDate) or
         DateUtil_ACC.isAfterDay(previousDate, policyExpirationDate)) {
        break
      }
    }

    if(DateUtil_ACC.isBeforeDay(previousDate, policyExpirationDate)) {
      policyEffectiveDates.add(new Pair<Date, Date>(previousDate.addDays(1), policyExpirationDate))
    }

    return policyEffectiveDates
  }

    public function rateDiscountAppliedModifier(modifier: Modifier,
                                              totalLevyAmount:BigDecimal,
                                              lineVersion:PolicyLine,
                                              rate : BigDecimal,
                                              proRataFactor : BigDecimal,
                                              policyEffectiveDates:List<Pair<Date,Date>>,
                                              onlyWSD : boolean) {
    if (modifier != null and modifier.BooleanModifier) {
      for (modifierDate in modifier.StartEndDate.EffectiveExpirationDate) {
        var resultProRataFactor = proRataFactor
	      if(!onlyWSD) {
		      resultProRataFactor = calculateProRateFactor(modifierDate, policyEffectiveDates)
      		if (proRataFactor == 1) {
        		if (resultProRataFactor > 0) {
          		resultProRataFactor = proRataFactor
        		} else {
          		resultProRataFactor = BigDecimal.ZERO
        		}
      		}
	      }
        if (resultProRataFactor > 0) {
          rateDiscountAppliedModifier(modifier, totalLevyAmount, lineVersion, rate, resultProRataFactor, modifierDate)
          if(onlyWSD) {
            break
          }
        }
      }
    }
  }

  public function rateDiscountAppliedModifier(modifier: Modifier, totalLevyAmount:BigDecimal, lineVersion:PolicyLine, rate : BigDecimal, proRataFactor : BigDecimal, modifierDate:EffectiveExpirationDate_ACC) {
    if(proRataFactor > 0) {
      var start = lineVersion.SliceDate
      var end = getNextSliceDateAfter(start)

      var data = createModifierCostData(start, end, lineVersion.FixedId, modifier.FixedId, modifierDate.FixedId)
      var existingCost = data.getExistingCost(lineVersion)

      data.StandardAdjRate = rate.negate() / 100
      data.StandardBaseRate = data.StandardAdjRate

      data.Basis = totalLevyAmount
      data.StandardTermAmount = data.StandardAdjRate * data.Basis
      data.StandardAmount = data.StandardTermAmount * proRataFactor

      data.NumDaysInRatedTerm = this.NumDaysInCoverageRatedTerm
      data.RoundingLevel = 2

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

  protected function calculateProRateFactor(modifierDate : EffectiveExpirationDate_ACC, policyEffectiveDates:List<Pair<Date,Date>>) : BigDecimal {
    var totalDays = BigDecimal.ZERO
    var daysApplied = BigDecimal.ZERO

    for(policyDate in policyEffectiveDates) {
      var calculateDays = calculateTotalDaysApplied(modifierDate, policyDate)
      totalDays = totalDays.add(calculateDays.Second)
      daysApplied = daysApplied.add(calculateDays.First)
    }

    if(totalDays == 0) {
      return BigDecimal.ZERO
    }

    if(daysApplied > totalDays) {
      daysApplied = totalDays
    }

    return (daysApplied/totalDays).setScale(4, RoundingMode.HALF_UP)
  }

  protected function calculateTotalDaysApplied(modifierDate: EffectiveExpirationDate_ACC, policyEffectiveDate: Pair<Date,Date>) : Pair<BigDecimal,BigDecimal> {
    var policyExpirationDate = PolicyLine.ExpirationDate
    var policyPeriod = PolicyLine.AssociatedPolicyPeriod

    if(PolicyLine.JobType == Job.TC_CANCELLATION) {
      policyExpirationDate = policyPeriod.CancellationDate
    } else if (PolicyLine.JobType == Job.TC_AUDIT) {
      policyExpirationDate = policyPeriod.Audit.AuditInformation.AuditPeriodEndDate
    }

    return (ProRationUtil_ACC.calculateAppliedDays(modifierDate.effectiveDate_ACC,
        modifierDate.expirationDate_ACC,
        policyEffectiveDate.First,
        policyEffectiveDate.Second,
        policyExpirationDate))
  }

  public property get OverrideHandler() : OverrideHandler {
      if (_overrideHandler == null) {
        var _receiver : Dynamic = new Expando()
        _receiver.ERStatus = ERStatus

        _logger.debug("ERStatus: ${_receiver.ERStatus}")

        _overrideHandler = new OverrideHandler(_receiver)
      }

      _logger.debug("OverrideHandlerInstance: " + _overrideHandler)

      return _overrideHandler
  }

  protected function performOverride(existingCost:Cost, data:CostData) {
    Funxion.buildExecutor(OverrideHandler).execute(\-> {
      if (PolicyLine typeis INDCPXLine == false and
          ERStatus == ERStatus_ACC.TC_ER_MODIFIER_PENDING or
          ERStatus == ERStatus_ACC.TC_NEXT_TERM_ER_MODIFIER_PENDING) {

        if (existingCost.OverrideReason.HasContent) {
          data.OverrideReason = existingCost.OverrideReason
        }
        data.copyOverridesFromCost(existingCost)
        //computeValuesFromCostOverrides(existingCost, data, true)
      } else {
        if (existingCost.OverrideReason == null or
            (existingCost.OverrideReason != null and
                (!existingCost.OverrideReason.equals(ERStatus_ACC.TC_ER_MODIFIER_PENDING.DisplayName) and
                    !existingCost.OverrideReason.equals(ERStatus_ACC.TC_NEXT_TERM_ER_MODIFIER_PENDING.DisplayName)))) {
          data.copyOverridesFromCost(existingCost)
        }
        if (existingCost.OverrideReason.HasContent) {
          data.OverrideReason = existingCost.OverrideReason
        }
//        computeValuesFromCostOverrides(existingCost, data, true)
      }
    })
  }

  protected function clearOverrideAndApplyToActual() {
    if(PolicyLine.JobType == Job.TC_CANCELLATION) {
      var costDatas = CostDatas.where(\elt -> elt.OverrideAmount != null or
                                              elt.OverrideBaseRate != null or
                                              elt.OverrideAdjRate != null or
                                              elt.OverrideTermAmount != null or
                                              elt.OverrideSource != OverrideSourceType.TC_MANUAL)
      for(cost in costDatas) {
        if (cost.OverrideBaseRate != null) {
          cost.ActualBaseRate = cost.OverrideBaseRate
          cost.ActualAdjRate = cost.OverrideBaseRate
          cost.ActualTermAmount = computeTermAmount(cost, cost.ActualAdjRate, false)
          cost.ActualAmount = cost.ActualTermAmount * (cost.StandardAmount / cost.StandardTermAmount)
        } else if (cost.OverrideAdjRate != null) {
          cost.ActualBaseRate = 0
          cost.ActualAdjRate = cost.OverrideAdjRate
          cost.ActualTermAmount = computeTermAmount(cost, cost.ActualAdjRate, false)
          cost.ActualAmount = cost.ActualTermAmount * (cost.StandardAmount / cost.StandardTermAmount)
        } else if (cost.OverrideTermAmount != null) {
          cost.Basis = 0
          cost.ActualBaseRate = 0
          cost.ActualAdjRate = 0
          cost.ActualTermAmount = cost.OverrideTermAmount
          cost.ActualAmount = cost.ActualTermAmount * (cost.StandardAmount / cost.StandardTermAmount)
        } else if (cost.OverrideAmount != null) {
          cost.Basis = 0
          cost.ActualBaseRate = 0
          cost.ActualAdjRate = 0
          cost.ActualTermAmount = 0
          cost.ActualAmount = cost.OverrideAmount
        }
        cost.OverrideReason = null
        cost.OverrideSource = OverrideSourceType.TC_MANUAL
        cost.OverrideAmount = null
        cost.OverrideTermAmount = null
        cost.OverrideBaseRate = null
        cost.OverrideAdjRate = null
      }
    }
  }

}
