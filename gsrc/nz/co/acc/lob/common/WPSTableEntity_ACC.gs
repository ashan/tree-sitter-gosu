package nz.co.acc.lob.common

uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by ManubaF on 6/03/2017.
 */
class WPSTableEntity_ACC {

  private var _costItem : SHCCost
  private var _isBasedOn : boolean
  private final var ZERO_MONEY = new MonetaryAmount(0, Currency.TC_NZD)

  construct(costItem : SHCCost, isBasedOn : boolean) {
    _costItem = costItem
    _isBasedOn = isBasedOn
  }

  property get Rank() : int {
    return _costItem.Rank
  }

  property get Code() : String {
    if(_costItem typeis CWPSWorkAccountLevyCost) {
      return _costItem.CWPSWorkAccountLevyCostItem.Code
    } else if(_costItem typeis CWPSResidualWorkAccountLevyCost) {
      return _costItem.ResWorkAccountLevyCostItem.Code
    }
    return null
  }

  property get Description() : String {
    if(_costItem typeis CWPSWorkAccountLevyCost) {
      return _costItem.CWPSWorkAccountLevyCostItem.Description
    } else if(_costItem typeis CWPSResidualWorkAccountLevyCost) {
      return _costItem.ResWorkAccountLevyCostItem.Description
    } else if (_costItem typeis CWPSModifierCost) {
      return _costItem.Description
    }
    return null
  }

  property get ProvEffDate() : Date {
    var costItem : SHCCost = null
    if(!_isBasedOn and _costItem.BasedOn != null) {
      costItem = _costItem.BasedOn
    } else if (_isBasedOn) {
      costItem = _costItem
    }
    return costItem.PeriodStart
  }

  property get ProvExpDate() : Date {
    var costItem : SHCCost = null
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

  property get ProvRate() : BigDecimal {
    var provRate = BigDecimal.ZERO
    if(!_isBasedOn and _costItem.BasedOn != null) {
      return _costItem.BasedOn.ActualAdjRate
    } else if (_isBasedOn) {
      return _costItem.ActualAdjRate
    }
    return provRate
  }

  property get ProvTermAmount() : MonetaryAmount {
    var actualTermAmount = ZERO_MONEY
    if(!_isBasedOn and _costItem.BasedOn != null) {
      return _costItem.BasedOn.ActualTermAmount
    } else if (_isBasedOn) {
      return _costItem.ActualTermAmount
    }
    return actualTermAmount
  }

  property get ProvProRataFactor() : BigDecimal {
    if(!_isBasedOn and _costItem.BasedOn != null) {
      return _costItem.BasedOn.ProRataFactor
    } else if (_isBasedOn) {
      return _costItem.ProRataFactor
    }
    return BigDecimal.ZERO
  }

  property get ProvAmount() : MonetaryAmount {
    var actualAmount = ZERO_MONEY
    if(!_isBasedOn and _costItem.BasedOn != null) {
      actualAmount = new MonetaryAmount(_costItem.BasedOn.ActualAmount, Currency.TC_NZD)
    } else if (_isBasedOn) {
      actualAmount = new MonetaryAmount(_costItem.ActualAmount, Currency.TC_NZD)
    }
    return actualAmount
  }

  property get FinalEffDate() : Date {
    return !_isBasedOn ? _costItem.PeriodStart : null
  }

  property get FinalExpDate() : Date {
    return !_isBasedOn ? _costItem.PeriodEnd : null
  }

  property get FinalBasis() : MonetaryAmount {
    var basis = ZERO_MONEY
    if(!_isBasedOn) {
      basis = new MonetaryAmount(_costItem.Basis, Currency.TC_NZD)
    }
    return basis
  }

  property get FinalRate() : BigDecimal {
    var provRate = BigDecimal.ZERO
    if(!_isBasedOn) {
      return _costItem.ActualAdjRate
    }
    return provRate
  }

  property get FinalTermAmount() : MonetaryAmount {
    var actualAmount = ZERO_MONEY
    if(!_isBasedOn) {
      return _costItem.ActualTermAmount
    }
    return actualAmount
  }

  property get FinalProRataFactor() : BigDecimal {
    if(!_isBasedOn) {
      return getProRataFactor(_costItem)
    }
    return BigDecimal.ZERO
  }

  function getProRataFactor(cost:SHCCost) : BigDecimal {
    return cost.ProRataFactor
  }

  property get FinalAmount() : MonetaryAmount {
    var actualAmount = ZERO_MONEY
    if(!_isBasedOn) {
      return _costItem.ActualAmount
    }
    return actualAmount
  }

  property get Difference() : MonetaryAmount {
    var difference : MonetaryAmount = null
    if(FinalAmount != null and ProvAmount != null)
      difference = FinalAmount - ProvAmount
    else if (FinalAmount != null)
      difference = FinalAmount
    else
      difference = - ProvAmount
    return difference
  }
}
