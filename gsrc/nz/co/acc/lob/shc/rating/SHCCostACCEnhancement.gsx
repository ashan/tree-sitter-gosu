package nz.co.acc.lob.shc.rating

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by Franklin Manubag on 9/4/2017.
 */
enhancement SHCCostACCEnhancement: SHCCost {
  property get Code() : String {
    if (this typeis CWPSWorkAccountLevyCost) {
      return this.CWPSWorkAccountLevyCostItem.Code
    } else if (this typeis CWPSResidualWorkAccountLevyCost) {
      return this.ResWorkAccountLevyCostItem.Code
    }
    return null
  }

  property get Description() : String {
    if (this typeis CWPSWorkAccountLevyCost) {
      return this.CWPSWorkAccountLevyCostItem.Description
    } else if (this typeis CWPSResidualWorkAccountLevyCost) {
      return this.ResWorkAccountLevyCostItem.Description
    } else if (this typeis CWPSModifierCost) {
      var modifierType = this.Modifier.TypeKeyModifier
      if(modifierType != null) {
        var builder = new StringBuilder()
        builder.append(this.Modifier.DisplayName)
        builder.append(" - ")
        builder.append(ExpRatingProgramme_ACC.get(modifierType))
        return builder.toString()
      }

      return this.Modifier.DisplayName
    }
    return null
  }

  property get Rank() : int {
    if (this typeis CWPSWorkAccountLevyCost) {
      return 1
    } else if (this typeis CWPSResidualWorkAccountLevyCost) {
      return 1
    } else if (this typeis CWPSModifierCost) {
      if(this.Modifier.Pattern.CodeIdentifier.contains("ExpRatingProgramme")){
        return 2
      }
      return 3
    } else if (this typeis CWPSEarnersLevyCost) {
      return 3
    } else if (this typeis CWPSResidualEarnersLevyCost) {
      return 4
    } else if (this typeis CWPSWorkingSaferLevyCost) {
      return 5
    }
    return -1
  }

  property get ProRataFactor() : BigDecimal {
    if(this typeis CWPSModifierCost) {
      if(this.Modifier.Pattern.CodeIdentifier.contains("DiscountApplied")) {
        if (this.ActualAmount_amt == BigDecimal.ZERO or this.ActualTermAmount_amt == BigDecimal.ZERO) {
          return BigDecimal.ZERO
        }
        return (this.ActualAmount_amt / this.ActualTermAmount_amt).setScale(4, RoundingMode.HALF_UP)
      } else {
        return BigDecimal.ONE
      }

    } else if(this typeis SHCDeductibleTaxCost || this typeis SHCNonDeductibleTaxCost) {
      return BigDecimal.ONE
    }

    return this.CWPSLine.CWPSCovs.first().ProRataFactor
  }

  function checkAmountAndSetProRataFactor(cost:EMPCost) : BigDecimal {
    if (cost.ActualAmount_amt == BigDecimal.ZERO or cost.ActualTermAmount_amt == BigDecimal.ZERO) {
      return BigDecimal.ZERO
    }
    return BigDecimal.ONE
  }

  property get PeriodStart() : Date {
    var periodStart = this.CWPSLine.AssociatedPolicyPeriod.PeriodStart
    if (this typeis CWPSModifierCost) {
      var modifierDate = (this as CWPSModifierCost).ModifierEffExpDate.effectiveDate_ACC
      periodStart = modifierDate != null and !this.PolicyLine.IsOnlyWSD() ? modifierDate : periodStart
    }

    if (periodStart == null || periodStart.before(this.PolicyLine.EffectiveDate)) {
      periodStart = this.PolicyLine.EffectiveDate
    }

    return periodStart
  }

  property get PeriodEnd() : Date {
    var periodEnd = this.CWPSLine.AssociatedPolicyPeriod.PeriodEnd
    if (this typeis CWPSModifierCost) {
      var modifierDate = (this as CWPSModifierCost).ModifierEffExpDate.expirationDate_ACC
      periodEnd = modifierDate != null and !this.PolicyLine.IsOnlyWSD() ? modifierDate : periodEnd
    }

    if (periodEnd == null || periodEnd.after(this.PolicyLine.ExpirationDate)) {
      periodEnd = this.PolicyLine.ExpirationDate
    }

    return periodEnd
  }
}
