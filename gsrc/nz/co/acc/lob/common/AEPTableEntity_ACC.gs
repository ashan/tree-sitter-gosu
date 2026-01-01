package nz.co.acc.lob.common

uses entity.EMPCost
uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal

/**
 * Created by ManubaF on 6/03/2017.
 */
class AEPTableEntity_ACC {

  private var _provCostItem: AEPCost_ACC
  private var _finalCostItem: AEPCost_ACC
  private final var ZERO_MONEY = new MonetaryAmount(0, Currency.TC_NZD)

  construct(provCostItem: AEPCost_ACC, finalCostItem: AEPCost_ACC) {
    _provCostItem = provCostItem
    _finalCostItem = finalCostItem
  }

  property get Code(): String {
    var cost = _provCostItem ?: _finalCostItem
    if (cost != null) {
        if (cost typeis AEPWorkAccountLevyCost_ACC or
            cost typeis AEPResidualWorkAccountLevyCost_ACC or
            cost typeis AEPPartnershipPlanDiscountCost_ACC) {
        return cost.AEPRateableCUData.CUCode
      }
    }
    return null
  }

  property get Description() : String {
    var cost = _provCostItem ?: _finalCostItem
    if (cost != null) {
      if (cost typeis AEPWorkAccountLevyCost_ACC or
          cost typeis AEPResidualWorkAccountLevyCost_ACC or
          cost typeis AEPPartnershipPlanDiscountCost_ACC) {
        return cost.AEPRateableCUData.CUDescription
      }
    }
    return _provCostItem.DisplayName
  }

  property get ProvEffDate() : Date {
    var policyDate : Date = null
    if(_provCostItem != null) {
      policyDate = _provCostItem.EffDate
    }
    return policyDate
  }

  property get ProvExpDate() : Date {
    var policyDate : Date = null
    if(_provCostItem != null) {
      policyDate = _provCostItem.ExpDate
    }
    return policyDate
  }

  property get ProvBasis() : MonetaryAmount {
    var basis = ZERO_MONEY
    if(_provCostItem != null) {
      basis = new MonetaryAmount(_provCostItem.Basis, Currency.TC_NZD)
    }
    return basis
  }

  property get ProvAdjRate() : BigDecimal {
    var provRate = BigDecimal.ZERO
    if(_provCostItem != null) {
      return _provCostItem.ActualAdjRate
    }
    return provRate
  }

  property get ProvActualAmount() : MonetaryAmount {
    var actualAmount = ZERO_MONEY
    if(_provCostItem != null) {
      actualAmount = new MonetaryAmount(_provCostItem.ActualAmount, Currency.TC_NZD)
    }
    return actualAmount
  }

  property get FinalEffDate() : Date {
    var policyDate : Date = null
    if(_finalCostItem != null) {
      policyDate = _finalCostItem.EffDate
    }
    return policyDate
  }

  property get FinalExpDate() : Date {
    var policyDate : Date = null
    if(_finalCostItem != null) {
      policyDate = _finalCostItem.ExpDate
    }
    return policyDate
  }

  property get FinalBasis() : MonetaryAmount {
    var basis = ZERO_MONEY
    if(_finalCostItem != null) {
      basis = new MonetaryAmount(_finalCostItem.Basis, Currency.TC_NZD)
    }
    return basis
  }

  property get FinalAdjRate() : BigDecimal {
    var provRate = BigDecimal.ZERO
    if(_finalCostItem != null) {
      return _finalCostItem.ActualAdjRate
    }
    return provRate
  }

  property get FinalActualAmount() : MonetaryAmount {
    var actualAmount = ZERO_MONEY
    if(_finalCostItem != null) {
      actualAmount = new MonetaryAmount(_finalCostItem.ActualAmount, Currency.TC_NZD)
    }
    return actualAmount
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

  property get CostItem() : AEPCost_ACC {
    if (_provCostItem != null) return _provCostItem
    if (_finalCostItem != null) return _finalCostItem
    return null
  }
}