package nz.co.acc.edge.capabilities.policy.lob.cp.dto

uses edge.jsonmapper.JsonProperty

uses java.math.BigDecimal

/**
 * Created by manubaf on 02/11/2020.
 */
class CPLiableEarningsDTO_ACC {
  @JsonProperty
  var _netSchedulerPayments : BigDecimal as NetSchedulerPayments

  @JsonProperty
  var _totalShareholderEmplSalary : BigDecimal as TotalShareholderEmplSalary

  @JsonProperty
  var _totalGrossIncome : BigDecimal as TotalGrossIncome

  @JsonProperty
  var _selfEmployedNetIncome : BigDecimal as SelfEmployedNetIncome

  @JsonProperty
  var _totalOtherExpensesClaimed : BigDecimal as TotalOtherExpensesClaimed

  @JsonProperty
  var _totalActivePartnershipInc : BigDecimal as TotalActivePartnershipInc

  @JsonProperty
  var _totalIncomeNotLiable : BigDecimal as TotalIncomeNotLiable

  @JsonProperty
  var _adjustedLTCIncome : BigDecimal as AdjustedLTCIncome

  @JsonProperty
  var _totalOtherNetIncome : BigDecimal as TotalOtherNetIncome

  @JsonProperty
  var _earningNotLiable : BigDecimal as EarningNotLiable

  @JsonProperty
  var _totalOverseasIncome : BigDecimal as TotalOverseasIncome
}