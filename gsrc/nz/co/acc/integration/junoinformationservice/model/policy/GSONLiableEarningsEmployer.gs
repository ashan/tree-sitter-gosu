package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 1/07/2020.
 */
class GSONLiableEarningsEmployer {
  public var adjustedLiableEarnings : BigDecimal
  public var embassyWorkerEarnings : BigDecimal
  public var eraChangedDate : String
  public var eraContractNumber : String
  public var eraIndicator : Boolean
  public var inflationAdjustmentApplied : Boolean
  public var isEmbassyWorker : Boolean
  public var paymentAfterFirstWeek : BigDecimal
  public var paymentToEmployees : BigDecimal
  public var totalEarningsNotLiable : BigDecimal
  public var totalExcessPaid : BigDecimal
  public var totalGrossEarnings : BigDecimal
  public var totalLiableEarnings : BigDecimal
  public var totalSchedularPayments : BigDecimal
}