package nz.co.acc.edge.capabilities.policy.lob.cp

uses edge.jsonmapper.JsonProperty

uses java.math.BigDecimal

class CPEarnings_ACC {
  @JsonProperty
  var _netSchedulerPayments : BigDecimal as NetSchedulerPayments

  @JsonProperty
  var _totalActivePartnershipInc : BigDecimal as TotalActivePartnershipInc

  @JsonProperty
  var _adjustedLTCIncome : BigDecimal as AdjustedLTCIncome

  @JsonProperty
  var _selfEmployedNetIncome : BigDecimal as SelfEmployedNetIncome

  @JsonProperty
  var _totalOtherExpensesClaimed : BigDecimal as TotalOtherExpensesClaimed
}