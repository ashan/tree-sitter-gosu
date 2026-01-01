package nz.co.acc.lob.ind.rating

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by ManubaF on 7/04/2017.
 */
enhancement INDCostACCEnhancement: INDCost {

  property get Code() : String {
    if(this typeis INDCoPWorkAccountLevyCost) {
      return this.WorkAccountLevyCostItem.Code
    } else if(this typeis INDCoPResidualWorkAccountLevyCost) {
      return this.ResWorkAccountLevyCostItem.Code
    }
    return null
  }

  property get Description() : String {
    if(this typeis INDCoPWorkAccountLevyCost) {
      return this.WorkAccountLevyCostItem.Description
    } else if(this typeis INDCoPResidualWorkAccountLevyCost) {
      return this.ResWorkAccountLevyCostItem.Description
    } else if ( this typeis INDCoPModifierCost) {
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
    if (this typeis INDCoPWorkAccountLevyCost) {
      return 1
    } else if (this typeis INDCoPResidualWorkAccountLevyCost) {
      return 1
    } else if (this typeis INDCoPModifierCost) {
      if(this.Modifier.Pattern.CodeIdentifier.contains("ExpRatingProgramme")){
        return 2
      }
      return 3
    } else if (this typeis INDCoPEarnersLevyCost) {
      return 3
    } else if (this typeis INDCoPResidualEarnersLevyCost) {
      return 4
    } else if (this typeis INDCoPWorkingSaferLevyCost) {
      return 5
    }
    return -1
  }

  property get ProRataFactor() : BigDecimal {
    if(this typeis INDCoPModifierCost) {
      if(this.Modifier.Pattern.CodeIdentifier.contains("DiscountApplied")) {
        if (this.ActualAmount_amt == BigDecimal.ZERO or this.ActualTermAmount_amt == BigDecimal.ZERO) {
          return BigDecimal.ZERO
        }
        return (this.ActualAmount_amt / this.ActualTermAmount_amt).setScale(4, RoundingMode.HALF_UP)
      } else {
        return checkAmountAndSetProRataFactor(this)
      }
    } else if(this typeis INDCoPWorkingSaferLevyCost and
              this.Branch.LevyYear_ACC < ScriptParameters.WorkingSaferStartLevyYear_ACC) {
      return BigDecimal.ONE
    } else if(!(this typeis INDCoPResidualWorkAccountLevyCost ||
                this typeis INDCoPResidualEarnersLevyCost)) {
      return this.INDCoPLine.INDCoPCovs.first().ProRataFactor
    }
    return BigDecimal.ONE
  }

  function checkAmountAndSetProRataFactor(cost:INDCost) : BigDecimal {
    if (cost.ActualAmount_amt == BigDecimal.ZERO or cost.ActualTermAmount_amt == BigDecimal.ZERO) {
      return BigDecimal.ZERO
    }
    return BigDecimal.ONE
  }

  property get PeriodStart() : Date {
    var periodStart = this.INDCoPLine.AssociatedPolicyPeriod.PeriodStart
    if (this typeis INDCoPModifierCost) {
      var modifierDate = (this as INDCoPModifierCost).ModifierEffExpDate.effectiveDate_ACC
      periodStart = modifierDate != null and !this.PolicyLine.IsOnlyWSD() ? modifierDate : periodStart
    }

    if (periodStart == null || periodStart.before(this.PolicyLine.EffectiveDate)) {
      periodStart = this.PolicyLine.EffectiveDate
    }

    return periodStart
  }

  property get PeriodEnd() : Date {
    var periodEnd = this.INDCoPLine.AssociatedPolicyPeriod.PeriodEnd
    if (this typeis INDCoPModifierCost) {
      var modifierDate = (this as INDCoPModifierCost).ModifierEffExpDate.expirationDate_ACC
      periodEnd = modifierDate != null and !this.PolicyLine.IsOnlyWSD() ? modifierDate : periodEnd
    }

    if (periodEnd == null || periodEnd.after(this.PolicyLine.ExpirationDate)) {
      periodEnd = this.PolicyLine.ExpirationDate
    }

    return periodEnd
  }

  property get CostItemAdjustedLiableEarnings() : BigDecimal {
    if(this typeis INDCoPWorkAccountLevyCost) {
      return this.WorkAccountLevyCostItem.AdjustedLiableEarnings.Amount
    }
    return null
  }
}
