package edge.capabilities.policy.lob.util

uses java.lang.UnsupportedOperationException
uses java.math.BigDecimal

uses edge.util.helper.CurrencyOpUtil
uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.policy.lob.dto.PolicyLineBaseDTO
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC

/**
 * Utilities for policy lines.
 */
class PolicyLineUtil {
  private construct() {
    throw new UnsupportedOperationException()
  }

  /** Fills base propeties on the policy line DTO. */
  public static function fillBaseProperties(res : PolicyLineBaseDTO, item :  PolicyLine) {
    res.PublicID = item.PublicID
    res.PolicyNumber = item.Branch.PolicyNumber
    res.LineOfBusiness = item.DisplayName
    res.ExpirationDate = item.ExpirationDate
    res.EffectiveDate = item.EffectiveDate
    res.Status = item.Branch.PeriodDisplayStatus
    res.TotalPremium = AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sum(
        item.Costs.where( \ cost -> cost.ChargePattern == ChargePattern.TC_PREMIUM)))

    if(item.AssociatedPolicyPeriod.Status == PolicyPeriodStatus.TC_DRAFT) {
      res.LevyCost = BigDecimal.ZERO
    } else {
      res.LevyCost = item?.Costs?.sum(\elt -> elt.ActualAmountBilling.Amount) ?:BigDecimal.ZERO
    }

    if(item.Branch.Status == PolicyPeriodStatus.TC_DRAFT) {
      res.LevyCostDifference = BigDecimal.ZERO
    } else if(item.Branch.Job typeis PolicyChange) {
      res.LevyCostDifference = res.LevyCost - (item?.BasedOn?.Costs?.sum(\elt -> elt.ActualAmountBilling.Amount) ?: BigDecimal.ZERO)
    } else if(item.Branch.Job typeis Renewal) {
      var policyLine = (PolicyUtil_ACC.getMostRecentPeriodByLevyYear_ACC(item.Branch.PolicyNumber, item.Branch.LevyYear_ACC - 1).Lines.firstWhere(\elt -> elt.DisplayName == item.DisplayName))
      var previousCosts = (policyLine?.Costs?.sum(\elt -> elt.ActualAmountBilling.Amount) ?: BigDecimal.ZERO)
      res.LevyCostDifference = res.LevyCost - previousCosts
    }
  }
  
  /**
   * Fills all properties on a coverage.
   */
  public static function fillBaseCoverage(res : CoverageDTO, coverage : Coverage, costs : Cost[]) {
    res.Name = coverage.Pattern.Name
    res.EffectiveDate = coverage.EffectiveDate
    res.ExpirationDate = coverage.ExpirationDate
    res.Premium = getPremium(costs)
    
    // Map the coverage terms
    for (term in coverage.CovTerms) {
      if (term.ModelType == typekey.CovTermModelType.TC_LIMIT) {
        res.Limit = term.DisplayValue
      } else if (term.ModelType == typekey.CovTermModelType.TC_DEDUCTIBLE) {
        res.Deductible = term.DisplayValue
      }
    }
  }
  
  /**
   * Creates a coverage DTO.
   */
  public static function createBaseCoverage(coverage : Coverage, costs : Cost[]) : CoverageDTO {
    final var res = new CoverageDTO()
    fillBaseCoverage(res, coverage, costs)
    return res
  }
  
  
  /**
   * Gets the premium for this coverage
   */
  @Param("costs", "The coverage's costs.")
  private static function getPremium(costs : Cost[]) : AmountDTO {
    for (cost in costs) {
      if (cost.ChargePattern == typekey.ChargePattern.TC_PREMIUM) {
        return AmountDTO.fromMonetaryAmount(cost.ActualAmount)
      }
    }
    
    return null
  }
}
