package nz.co.acc.lob.common

uses entity.*
uses entity.EMPWPCLine
uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by ManubaF on 6/03/2017.
 */
class WPCTableEntity_ACC {

  private var _costItem : EMPCost
  private var _isBasedOn : boolean
  private final var ZERO_MONEY = new gw.pl.currency.MonetaryAmount(0, Currency.TC_NZD)

  construct(costItem : EMPCost, isBasedOn : boolean) {
    _costItem = costItem
    _isBasedOn = isBasedOn
  }

  property get Rank() : int {
    return _costItem.Rank
  }

  property get Code() : String {
    if(_costItem typeis EMPWorkAccountLevyItemCost) {
      return _costItem.EMPWorkAccountLevyCostItem.Code
    } else if (_costItem typeis EMPResidualWorkAccountLevyItemCost) {
      return _costItem.ResWorkAccountLevyCostItem.Code
    }
    return null
  }

  property get Description() : String {
    var description : String = null
    if(_costItem typeis EMPWorkAccountLevyItemCost) {
      description = _costItem.EMPWorkAccountLevyCostItem.Description
    } else if (_costItem typeis EMPResidualWorkAccountLevyItemCost) {
      description = _costItem.ResWorkAccountLevyCostItem.Description
    } else if (_costItem typeis EMPWPCModifierCost) {
      description = _costItem.Description
    }
    return description
  }

  property get ProvEffDate() : Date {
    var costItem : EMPCost = null
    if(!_isBasedOn and _costItem.BasedOn != null) {
      costItem = _costItem.BasedOn
    } else if (_isBasedOn) {
      costItem = _costItem
    }
    return costItem.PeriodStart
  }

  property get ProvExpDate() : Date {
    var costItem : EMPCost = null
    if(!_isBasedOn and _costItem.BasedOn != null) {
      costItem = _costItem.BasedOn
    } else if (_isBasedOn) {
      costItem = _costItem
    }
    return costItem.PeriodEnd
  }

  property get ProvBasis() : MonetaryAmount {
    var basis = ZERO_MONEY
    if(!_isBasedOn and _costItem.BasedOn != null) {
      basis = new MonetaryAmount(_costItem.BasedOn.Basis, Currency.TC_NZD)
    } else if (_isBasedOn) {
      basis = new MonetaryAmount(_costItem.Basis, Currency.TC_NZD)
    }
    return basis
  }

  property get ProvAdjRate() : BigDecimal {
    var provRate = BigDecimal.ZERO
    if(!_isBasedOn and _costItem.BasedOn != null) {
      return _costItem.BasedOn.ActualAdjRate
    } else if (_isBasedOn) {
      return _costItem.ActualAdjRate
    }
    return provRate
  }

  property get ProvActualAmount() : MonetaryAmount {
    var actualAmount = ZERO_MONEY
    if(!_isBasedOn and _costItem.BasedOn != null) {
      actualAmount = new MonetaryAmount(_costItem.BasedOn.ActualAmount, Currency.TC_NZD)
    } else if (_isBasedOn) {
      actualAmount = new MonetaryAmount(_costItem.ActualAmount, Currency.TC_NZD)
    }
    return actualAmount
  }

  property get ProvTermAmount() : MonetaryAmount {
    var actualAmount = ZERO_MONEY
    if(!_isBasedOn and _costItem.BasedOn != null) {
      actualAmount = new MonetaryAmount(_costItem.BasedOn.ActualTermAmount, Currency.TC_NZD)
    } else if (_isBasedOn) {
      actualAmount = new MonetaryAmount(_costItem.ActualTermAmount, Currency.TC_NZD)
    }
    return actualAmount
  }

  property get ProvProRataFactor() : BigDecimal {
    if(!_isBasedOn and _costItem.BasedOn != null) {
      return _costItem.BasedOn.ProRataFactor
    } else if (_isBasedOn) {
      return _costItem.ProRataFactor
    }
    return BigDecimal.ZERO
  }

  function getProRataFactor(cost:EMPCost) : BigDecimal {
    if(cost typeis EMPWPCModifierCost) {
      if(cost.Modifier.Pattern.CodeIdentifier.contains("DiscountApplied")) {
        if(cost.ActualAmount_amt == BigDecimal.ZERO or cost.ActualTermAmount_amt == BigDecimal.ZERO) {
          return BigDecimal.ZERO
        }
        return (cost.ActualAmount_amt / cost.ActualTermAmount_amt).setScale(4, RoundingMode.HALF_UP)
      } else {
        return BigDecimal.ONE
      }
    } else if(cost typeis EMPTaxCost) {
      return BigDecimal.ONE
    }

    return cost.EMPWPCLine.EMPWPCCovs.first().ProRataFactor
  }

  property get FinalEffDate() : Date {
    var policyDate: Date = null
    if (!_isBasedOn) {
      policyDate = _costItem.EffDate
      if (_costItem typeis EMPWPCModifierCost) {
        var modifierDate = (_costItem as EMPWPCModifierCost).ModifierEffExpDate.effectiveDate_ACC
        policyDate = modifierDate != null and modifierDate.after(_costItem.PolicyLine.EffectiveDate) ? modifierDate : _costItem.EffDate
      }
    }
    return policyDate
  }

  property get FinalExpDate() : Date {
    var policyDate: Date = null
    if (!_isBasedOn) {
      policyDate = _costItem.ExpDate
      if (_costItem typeis EMPWPCModifierCost) {
        var modifierDate = (_costItem as EMPWPCModifierCost).ModifierEffExpDate.expirationDate_ACC
        policyDate = modifierDate != null and modifierDate.before(_costItem.PolicyLine.ExpirationDate) ? modifierDate : _costItem.ExpDate
      }
    }
    return policyDate
  }

  property get FinalBasis() : MonetaryAmount {
    var basis = ZERO_MONEY
    if(!_isBasedOn) {
      basis = new MonetaryAmount(_costItem.Basis, Currency.TC_NZD)
    }
    return basis
  }

  property get FinalAdjRate() : BigDecimal {
    var provRate : BigDecimal = null
    if(!_isBasedOn) {
      return _costItem.ActualAdjRate
    }
    return provRate
  }

  property get FinalActualAmount() : MonetaryAmount {
    var actualAmount = ZERO_MONEY
    if(!_isBasedOn) {
      actualAmount = new MonetaryAmount(_costItem.ActualAmount, Currency.TC_NZD)
    }
    return actualAmount
  }

  property get FinalTermAmount() : MonetaryAmount {
    var actualAmount = ZERO_MONEY
    if(!_isBasedOn) {
      actualAmount = new MonetaryAmount(_costItem.ActualTermAmount, Currency.TC_NZD)
    }
    return actualAmount
  }

  property get FinalProRataFactor() : BigDecimal {
    if(!_isBasedOn) {
      return _costItem.ProRataFactor
    }
    return BigDecimal.ZERO
  }

  property get Difference() : MonetaryAmount {
    var difference : MonetaryAmount = null
    if(FinalActualAmount != null and ProvActualAmount != null)
      difference = FinalActualAmount - ProvActualAmount
    else if (FinalActualAmount != null)
      difference = FinalActualAmount
    else
      difference = - ProvActualAmount
    return difference
  }
}
