package nz.co.acc.lob.cpx.rating

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by Franklin Manubag on 9/4/2017.
 */
enhancement CPXCostACCEnhancement: CPXCost {
  property get Code() : String {
    if (this typeis INDCPXWorkAccountLevyCost) {
      return this.WorkAccountLevyCostItem.Code
    }
    return null
  }

  property get Description() : String {
    if (this typeis INDCPXWorkAccountLevyCost) {
      return this.WorkAccountLevyCostItem.Description
    } else if (this typeis CPXModifierCost) {
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
    if (this typeis INDCPXWorkAccountLevyCost) {
      return 1
    } else if (this typeis CPXModifierCost) {
      if(this.Modifier.Pattern.CodeIdentifier.contains("ExpRatingProgramme")){
        return 2
      }
      return 3
    }
    return -1
  }

  property get ProRataFactor() : BigDecimal {
    if (this typeis CPXModifierCost) {
      if(this.ActualAmount_amt == BigDecimal.ZERO or this.ActualTermAmount_amt == BigDecimal.ZERO) {
        return BigDecimal.ZERO
      }
      return (this.ActualAmount_amt / this.ActualTermAmount_amt).setScale(4, RoundingMode.HALF_UP)
    } else if(this typeis INDCPXLiableCost){
      return this.CPXInfoCov.ProRataFactor
    }
    return BigDecimal.ZERO
  }

  function checkAmountAndSetProRataFactor(cost:CPXCost) : BigDecimal {
    if (cost.ActualAmount_amt == BigDecimal.ZERO or cost.ActualTermAmount_amt == BigDecimal.ZERO) {
      return BigDecimal.ZERO
    }
    return BigDecimal.ONE
  }

  property get PeriodStart() : Date {
    var periodStart = this.CPXInfoCov.PeriodStart
    if (this typeis CPXModifierCost) {
      var modifierDate = (this as CPXModifierCost).ModifierEffExpDate.effectiveDate_ACC
      periodStart = modifierDate != null and !this.PolicyLine.IsOnlyWSD()? modifierDate : periodStart
    }

    if (periodStart == null || periodStart.before(this.PolicyLine.EffectiveDate)) {
      periodStart = this.PolicyLine.EffectiveDate
    }

    return periodStart
  }

  property get PeriodEnd() : Date {
    var periodEnd = this.CPXInfoCov.PeriodEnd
    if (this typeis CPXModifierCost) {
      var modifierDate = (this as CPXModifierCost).ModifierEffExpDate.expirationDate_ACC
      periodEnd = modifierDate != null and !this.PolicyLine.IsOnlyWSD() ? modifierDate : periodEnd
    }

    if (periodEnd == null || periodEnd.after(this.PolicyLine.ExpirationDate)) {
      periodEnd = this.PolicyLine.ExpirationDate
    }

    return periodEnd
  }

  property get ALOCFactor() : BigDecimal {
    if(this typeis INDCPXEarnersLevyCost) {
      return this.CPXInfoCov.ALOCFactor
    }
    return null
  }
}
