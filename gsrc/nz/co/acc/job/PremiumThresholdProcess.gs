package nz.co.acc.job

uses gw.pl.currency.MonetaryAmount
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses gw.util.concurrent.LockingLazyVar
uses nz.co.acc.constants.ProductCode

uses java.math.BigDecimal
uses java.math.RoundingMode

class PremiumThresholdProcess {
  private final static var LOG = StructuredLogger_ACC.CONFIG.withClass(PremiumThresholdProcess)
  private final var _branch : PolicyPeriod as Branch
  private final var _lazyBasedOnBranch = LockingLazyVar.make(\-> lastBasedOnPeriodWithNonZeroTransactionCost())

  construct(branch : PolicyPeriod) {
    this._branch = branch
  }

  property get BasedOnBranch() : PolicyPeriod {
    return _lazyBasedOnBranch.get()
  }

  function processQuote(applyPremiumThreshold : boolean) {
    // Always reset this value when generating a new quote
    Branch.PremiumThresholdDisabled_ACC = false

    if (not Branch.AllCosts.HasElements) {
      logInfo("Skipping premium threshold for branch with no costs")
      return
    }

    if (applyPremiumThreshold) {
      if (Branch.IsPolicyPeriodLevyYearHistoric_ACC) {
        applyPremiumThresholdOverrideForHistoric()
      } else {
        applyPremiumThresholdOverride()
      }
    } else {
      logInfo("Skipping premium threshold due to manual override")
    }

    updateCostValuesFromOverrides()
  }

  function isBelowPremiumThreshold() : boolean {
    if (Branch.PremiumThresholdDisabled_ACC) {
      logInfo("Skipping validation for branch with premium threshold disabled by manual overrides.")
      return false
    }
    if (not Branch.AllCosts.HasElements) {
      logInfo("Skipping validation for branch with no costs")
      return false
    }

    var totalPremium = Branch.TotalAmountExclGST_ACC
    var taxInvoicePremiumThreshold = getTaxInvoicePremiumThreshold()
    var reassessmentPremiumThreshold = getReasesssmentPremiumThreshold()

    if (Branch.TransactionCostRPT_amt == null or totalPremium == 0) {
      return false
    } else if (BasedOnBranch == null) {
      // Tax Invoice
      return Branch.TotalCostRPT_amt != BigDecimal.ZERO and Branch.TotalAmountExclGST_ACC <= taxInvoicePremiumThreshold
    } else if (Branch.TransactionCostRPT_amt != BigDecimal.ZERO) {
      // Reassessment
      var difference = totalPremium - BasedOnBranch.TotalPremiumRPT_amt ?: BigDecimal.ZERO
      if (difference <= 0) {
        return false
      } else {
        return difference < reassessmentPremiumThreshold
      }
    } else {
      return false
    }
  }

  private function applyPremiumThresholdOverride() {
    var previousTotalAmount = BigDecimal.ZERO
    if (BasedOnBranch != null and (Branch.Job.Subtype != typekey.Job.TC_RENEWAL and Branch.Job.Subtype != typekey.Job.TC_SUBMISSION)) {
      previousTotalAmount = BasedOnBranch.TotalAmountExclGST_ACC
    }
    var totalAmount = Branch.TotalAmountExclGST_ACC
    var reassessmentAmount = totalAmount - previousTotalAmount
    var taxInvoicePremiumThreshold = getTaxInvoicePremiumThreshold()
    var reassessmentPremiumThreshold = getReasesssmentPremiumThreshold()

    if (!Branch.AEPLineExists
        and (Branch.PPERStatus_ACC == ERStatus_ACC.TC_NEXT_TERM_ER_MODIFIER_PENDING
        or Branch.PPERStatus_ACC == ERStatus_ACC.TC_ER_MODIFIER_PENDING)) {
      logInfo("Applying override for '${Branch.PPERStatus_ACC.DisplayName}'")
      overrideCostsToMatchBasedOnBranch(Branch.PPERStatus_ACC.DisplayName)

    } else if (Branch.TotalAmountInclGST_ACC != 0) {
      if (totalAmount <= taxInvoicePremiumThreshold) {
        // full refund
        logInfo("Applying full refund override for total cost (totalAmount=${totalAmount}, taxInvoicePremiumThreshold=${taxInvoicePremiumThreshold}")
        applyFullRefund("Below Premium Threshold")
      } else if (reassessmentAmount > 0d and reassessmentAmount < reassessmentPremiumThreshold) {
        logInfo("Applying override for reassessment debit cost difference (reassessmentAmount=${reassessmentAmount}, reassessmentPremiumThreshold=${reassessmentPremiumThreshold})")
        overrideCostsToMatchBasedOnBranch("Below Premium Threshold")
      } else {
        logInfo("totalAmount=${totalAmount}, taxInvoicePremiumThreshold=${taxInvoicePremiumThreshold}, reassessmentAmount=${reassessmentAmount}, clearing premium threshold overrides")
        clearPremiumThresholdOverrides()
      }
    } else {
      logInfo("TotalAmountInclGST_ACC=0, clearing premium threshold overrides")
      clearPremiumThresholdOverrides()
    }
  }

  public function applyPremiumThresholdOverrideForHistoric() {
    var totalAmount = Branch.TotalAmountExclGST_ACC
    var taxInvoicePremiumThreshold = getTaxInvoicePremiumThreshold()
    if (totalAmount <= taxInvoicePremiumThreshold) {
      logInfo("Applying full refund override for total cost on historic policy term")
      applyFullRefund("Below Premium Threshold")
    } else {
      var difference = calculateDifferenceFromPreviousTransaction()
      if (difference > 0) {
        logInfo("Applying override for debit reassessment cost difference on historic policy term (difference=${difference})")
        overrideCostsToMatchBasedOnBranch("Historic Debit Assessment")
      } else {
        // Credit is allowed. Remove any overrides that may have been set previously in the draft transaction
        // while user is editing
        logInfo("Allowing credit on historic policy term (cost difference=${difference}). Clearing premium threshold overrides")
        clearPremiumThresholdOverrides()
      }
    }
  }

  private function clearPremiumThresholdOverrides() {
    for (cost in Branch.AllCosts) {
      if ((cost.HasOverride or cost.OverrideReason != null) and cost.OverrideSource == OverrideSourceType.TC_PREMIUMTHRESHOLD_ACC) {
        logInfo("Resetting premium threshold override on cost ${cost.TypeIDString}")
        cost.resetOverrides()
        cost.resetOverrideSource_ACC()
        cost.copyStandardColumnsToActualColumns()
      }
    }
  }

  private function getTaxInvoicePremiumThreshold() : BigDecimal {
    if (Branch.Policy.ProductCode_ACC == ProductCode.IndividualACC) {
      return ScriptParameters.PremiumThresholdSelfEmployedTaxInvoice_ACC
    } else {
      return ScriptParameters.PremiumThresholdEmployerTaxInvoice_ACC
    }
  }

  private function getReasesssmentPremiumThreshold() : BigDecimal {
    if (Branch.Policy.ProductCode_ACC == ProductCode.IndividualACC) {
      return ScriptParameters.PremiumThresholdSelfEmployedReassessment_ACC
    } else {
      return ScriptParameters.PremiumThresholdEmployerReassessment_ACC
    }
  }

  private function calculateDifferenceFromPreviousTransaction() : BigDecimal {
    var previousTotalExclGST = BigDecimal.ZERO
    if (not Branch.Job.IsRenewal_ACC and not Branch.Job.IsSubmission_ACC and BasedOnBranch != null) {
      previousTotalExclGST = BasedOnBranch.TotalAmountExclGST_ACC
    }
    return Branch.TotalAmountExclGST_ACC - previousTotalExclGST
  }

  private function applyFullRefund(overrideReason : String) {
    for (cost in Branch.AllCosts) {
      cost.OverrideAmount = 0bd.toMonetaryAmount()
      cost.OverrideAmountBilling = 0bd.toMonetaryAmount()
      cost.OverrideReason = overrideReason
      cost.OverrideSource = OverrideSourceType.TC_PREMIUMTHRESHOLD_ACC
    }
  }

  private function overrideCostsToMatchBasedOnBranch(overrideReason : String) {
    var basedOnTotal = BasedOnBranch?.TotalAmountInclGST_ACC ?: BigDecimal.ZERO
    overrideAllCostsWithOriginalAmounts(overrideReason)
    var overrideTotal = getTotalOverrideAmount()
    if (overrideTotal == basedOnTotal) {
      if (LOG.DebugEnabled) {
        LOG.debug("overrideTotal ${overrideTotal} matches expected basedOnTotal ${basedOnTotal}")
      }
    } else {
      if (LOG.DebugEnabled) {
        LOG.info("overrideTotal ${overrideTotal} does not match expected basedOnTotal ${basedOnTotal}")
      }
      var difference = basedOnTotal - overrideTotal
      distributeCostDifference(difference, overrideReason)
      overrideTotal = getTotalOverrideAmount()
      if (overrideTotal != basedOnTotal) {
        throw new RuntimeException("overrideTotal ${overrideTotal} does not match expected basedOnTotal ${basedOnTotal} after cost distribution")
      }
    }
  }

  private function distributeCostDifference(difference : BigDecimal, overrideReason : String) {
    var largestCost = Branch.AllCosts.maxBy(\cost -> cost.ActualAmount)
    largestCost.OverrideAmount += difference.toMonetaryAmount()
    largestCost.OverrideReason = overrideReason
    largestCost.OverrideSource = OverrideSourceType.TC_PREMIUMTHRESHOLD_ACC
    if (LOG.DebugEnabled) {
      LOG.debug("Distributed cost difference ${difference} to cost ${largestCost.TypeIDString} with new OverrideAmount ${largestCost.OverrideAmount}")
    }
  }

  private function overrideAllCostsWithOriginalAmounts(overrideReason : String) {
    for (cost in Branch.AllCosts) {
      var originalCost = findOriginalCost(cost)
      overrideCostWithOriginal(cost, originalCost, overrideReason)
    }
  }

  private function getTotalOverrideAmount() : BigDecimal {
    return Branch.AllCosts.map(\cost -> cost.OverrideAmount_amt).sum() ?: BigDecimal.ZERO
  }

  private function findOriginalCost(c : Cost) : Cost {
    if (BasedOnBranch == null) {
      return null
    }
    var originalCost = c.BasedOnUntyped as Cost
    while (originalCost != null and originalCost.PolicyLine.AssociatedPolicyPeriod != BasedOnBranch) {
      originalCost = originalCost.BasedOnUntyped as Cost
    }
    return originalCost
  }

  private function overrideCostWithOriginal(cost : Cost, originalCost : Cost, overrideReason : String) : BigDecimal {
    if (originalCost == null) {
      cost.OverrideAmount = 0bd.toMonetaryAmount()
      cost.OverrideAmountBilling = 0bd.toMonetaryAmount()
      cost.OverrideReason = overrideReason
      cost.OverrideSource = OverrideSourceType.TC_PREMIUMTHRESHOLD_ACC
    } else {
      cost.OverrideAmount = originalCost.ActualAmount
      cost.OverrideReason = overrideReason
      cost.OverrideSource = OverrideSourceType.TC_PREMIUMTHRESHOLD_ACC
    }
    return cost.OverrideAmount
  }

  private function updateCostValuesFromOverrides() {
    for (cost in Branch.AllCosts) {
      if (cost.HasOverride) {
        computeValuesFromCostOverrides(cost)
      }
    }
  }

  private function computeValuesFromCostOverrides(cost : Cost) {
    if (cost.OverrideBaseRate != null) {
      cost.ActualBaseRate = cost.OverrideBaseRate
      cost.ActualAdjRate = cost.OverrideBaseRate
      cost.ActualTermAmount = new MonetaryAmount(computeTermAmount(cost, cost.ActualAdjRate), Currency.TC_NZD)
      cost.ActualAmount = cost.ActualTermAmount
      cost.ActualAmountBilling = cost.ActualTermAmount
      cost.ActualTermAmountBilling = cost.ActualTermAmount
    } else if (cost.OverrideAdjRate != null) {
      cost.ActualBaseRate = 0
      cost.ActualAdjRate = cost.OverrideAdjRate
      cost.ActualTermAmount = new MonetaryAmount(computeTermAmount(cost, cost.ActualAdjRate), Currency.TC_NZD)
      cost.ActualAmount = cost.ActualTermAmount
      cost.ActualAmountBilling = cost.ActualTermAmount
      cost.ActualTermAmountBilling = cost.ActualTermAmount
    } else if (cost.OverrideTermAmount != null) {
      cost.ActualBaseRate = 0
      cost.ActualAdjRate = 0
      cost.ActualTermAmount = cost.OverrideTermAmount
      cost.ActualAmountBilling = cost.ActualTermAmount
      cost.ActualTermAmountBilling = cost.ActualTermAmount
    } else if (cost.OverrideAmount != null) {
      cost.ActualBaseRate = 0
      cost.ActualAdjRate = 0
      cost.ActualTermAmount = 0.00bd.toMonetaryAmount()
      cost.ActualAmount = cost.OverrideAmount
      cost.ActualAmountBilling = cost.OverrideAmount
      cost.ActualTermAmountBilling = cost.ActualTermAmount
    }
  }

  private function computeTermAmount(cost : Cost, rate : BigDecimal) : BigDecimal {
    var asPercentage = cost.RateAmountType != RateAmountType.TC_TAXSURCHARGE
    if (asPercentage) {
      rate = rate / 100
    }
    return (cost.Basis * rate).setScale(2, RoundingMode.HALF_UP)
  }

  private function lastBasedOnPeriodWithNonZeroTransactionCost() : PolicyPeriod {
    var lastBoundPP = Branch.BasedOn.PolicyTerm == Branch.PolicyTerm ? Branch.BasedOn : null
    var previousPP : PolicyPeriod = null
    while (lastBoundPP != null and lastBoundPP.TransactionCostRPT_amt.IsZero and Branch.PolicyTerm == lastBoundPP.PolicyTerm) {
      previousPP = lastBoundPP
      lastBoundPP = lastBoundPP.BasedOn
    }

    if (lastBoundPP != null and lastBoundPP.PolicyTerm != Branch.PolicyTerm) {
      if (previousPP != null and previousPP.TransactionCostRPT_amt.IsZero) {
        return null
      } else {
        return previousPP
      }
    }
    return lastBoundPP
  }

  private function logInfo(msg : String) {
    LOG.info("PolicyNumber: ${Branch.PolicyNumber}, Transaction: ${Branch.Job.JobNumber}, Branch: ${Branch.ID} - ${msg}")
  }
}