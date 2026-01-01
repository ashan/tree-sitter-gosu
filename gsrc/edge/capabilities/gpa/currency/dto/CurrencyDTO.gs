package edge.capabilities.gpa.currency.dto

uses java.math.BigDecimal
uses edge.jsonmapper.JsonProperty

class CurrencyDTO {

  @JsonProperty
  var _currency : typekey.Currency as Currency

  @JsonProperty
  var _amount : BigDecimal as Amount
}
