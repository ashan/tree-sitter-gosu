package nz.co.acc.edge.capabilities.policy.lob.wpc.dto

uses edge.jsonmapper.JsonProperty

uses java.math.BigDecimal

class WPCEarnings_ACC {
  @JsonProperty
  var _totalGrossEarnings : BigDecimal as TotalGrossEarnings

  @JsonProperty
  var _totalEarningsNotLiable : BigDecimal as TotalEarningsNotLiable

  @JsonProperty
  var _totalPAYE : BigDecimal as TotalPAYE

  @JsonProperty
  var _totalExcessPaid : BigDecimal as TotalExcessPaid

  @JsonProperty
  var _paymentToEmployees : BigDecimal as PaymentToEmployees
}