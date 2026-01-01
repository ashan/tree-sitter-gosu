package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

class GSONAEPMemberCUData {
  public var publicId: String
  public var cuCode: String
  public var cuDescription: String
  public var liableEarnings: BigDecimal
  public var proratedLiableEarnings: BigDecimal
  public var liableEarningsOverride: BigDecimal
  public var newAepCustomer: Boolean
  public var ceasedCustomerTrading: Boolean
}