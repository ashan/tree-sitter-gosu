package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 31/08/20.
 */
class GSONAEPCost {
  public var amount : BigDecimal
  public var basis : BigDecimal
  public var chargePattern : String
  public var chargeType : String
  public var cuCode : String
  public var cuDescription : String
  public var effectiveDate : String
  public var expirationDate : String
  public var proration : BigDecimal
  public var rate : BigDecimal
  public var termAmount : BigDecimal

  public construct() {
  }

  public construct(cost : AEPCost_ACC) {
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
  }
}