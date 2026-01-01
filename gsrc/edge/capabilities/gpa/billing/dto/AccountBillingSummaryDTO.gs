package edge.capabilities.gpa.billing.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.gpa.currency.dto.CurrencyDTO
uses gw.api.util.CurrencyUtil

class AccountBillingSummaryDTO {

  @JsonProperty
  var _isDelinquent : boolean as IsDelinquent

  @JsonProperty
  var _outstandingCurrent : CurrencyDTO as OutstandingCurrent

  @JsonProperty
  var _outstandingPastDue : CurrencyDTO as OutstandingPastDue

  @JsonProperty
  var _outstandingTotal : CurrencyDTO as OutstandingTotal

  @JsonProperty
  var _collateralRequirement : CurrencyDTO as CollateralRequirement

  @JsonProperty
  var _collateralHeld : CurrencyDTO as CollateralHeld

  @JsonProperty
  var _unbilled : CurrencyDTO as Unbilled

  @JsonProperty
  var _unappliedFunds : CurrencyDTO as UnappliedFunds

  @JsonProperty
  var _primaryPayer : PrimaryPayerDTO as PrimaryPayer


}
