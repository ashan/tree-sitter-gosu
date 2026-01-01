package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

uses entity.AEPCost_ACC

/**
 * Created by Mike Ourednik on 31/08/20.
 */
class GSONAEPStopLossCost extends GSONAEPCost {
  public var stopLossLimit : BigDecimal
  public var stopLossLimitWorkAccLevyRatio : BigDecimal

  public construct() {
  }

  public construct(cost : AEPStopLossLevyCost_ACC) {
    amount = cost.ActualAmount
    basis = cost.Basis
    chargePattern = cost.ChargePattern.Code
    chargeType = (typeof cost).toString().replace("entity.", "")
    cuCode = cost.CUCode
    cuDescription = cost.CUDescription
    effectiveDate = cost.EffDate?.toISODate()
    expirationDate = cost.ExpDate?.toISODate()
    proration = cost.Proration
    rate = cost.ActualAdjRate
    termAmount = cost.ActualTermAmount
    stopLossLimit = cost.CalcStopLossLimit
    stopLossLimit = cost.StopLossLimit
    stopLossLimitWorkAccLevyRatio = cost.StopLossLimitWorkAccLevyRatio
  }
}