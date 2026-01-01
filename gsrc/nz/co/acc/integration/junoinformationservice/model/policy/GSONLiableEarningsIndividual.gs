package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 1/07/2020.
 */
class GSONLiableEarningsIndividual {
  //  public var isFullTime: Boolean
  public var taxYear : Integer
  public var adjustedLtcIncome : BigDecimal
  public var adjustedLiableEarnings : BigDecimal
  public var earningsNotLiable : BigDecimal
  public var netSchedularPayments : BigDecimal
  public var selfEmployedNetIncome : BigDecimal
  public var totalActivePartnershipIncome : BigDecimal
  public var totalGrossIncome : BigDecimal
  public var totalIncomeNotLiable : BigDecimal
  public var totalLiableEarnings : BigDecimal
  public var totalOtherExpensesClaimed : BigDecimal
  public var totalOtherNetIncome : BigDecimal
  public var totalOverseasIncome : BigDecimal
  public var totalShareholderEmplSalary : BigDecimal
}