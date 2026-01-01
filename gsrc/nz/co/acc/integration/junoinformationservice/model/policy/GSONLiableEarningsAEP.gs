package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 1/07/2020.
 */
class GSONLiableEarningsAEP {
  public var adjustedLiableEarnings : BigDecimal
  public var paymentAfterFirstWeek : BigDecimal
  public var paymentForFirstWeek : BigDecimal
  public var totalEarningsNotLiable : BigDecimal
  public var totalExcessPaid : BigDecimal
  public var totalGrossEarnings : BigDecimal
  public var totalLiableEarnings : BigDecimal
  public var totalSchedularPayments : BigDecimal
}