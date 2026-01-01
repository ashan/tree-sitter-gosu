package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

class GSONAEPMemberData {
  public var publicId: String
  public var accId: String
  public var companyName: String
  public var productCode: String
  public var productName: String
  public var policyNumber: String
  public var termDaysForProration: Integer
  public var totalGrossEarnings: BigDecimal
  public var totalEarningsNotLiable: BigDecimal
  public var totalPaye: BigDecimal
  public var totalExcessPaid: BigDecimal
  public var totalLiableEarnings: BigDecimal
  public var adjustedLiableEarnings: BigDecimal
  public var adjustedLiableEarningsLessCpx: BigDecimal
  public var paymentForFirstWeek: BigDecimal
  public var paymentAfterFirstWeek: BigDecimal
  public var newAepCustomer: Boolean
  public var ceasedCustomerTrading: Boolean
  public var aepMemberCuData: GSONAEPMemberCUData[] 
}
