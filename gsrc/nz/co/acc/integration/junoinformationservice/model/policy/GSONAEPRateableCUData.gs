package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

class GSONAEPRateableCUData {
  public var publicId: String
  public var cuCode: String
  public var cuDescription: String
  public var liableEarnings: BigDecimal
  public var workRate: BigDecimal
  public var standardLevy: BigDecimal
}