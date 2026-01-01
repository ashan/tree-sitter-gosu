package edge.capabilities.gpa.billing.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.gpa.currency.dto.CurrencyDTO

class AccountBillingDTO {

  @JsonProperty
  var _ownedPolicies : PolicyPeriodBillingSummaryDTO[] as OwnedPolicies

  @JsonProperty
  var _unownedPolicies : PolicyPeriodBillingSummaryDTO[] as UnownedPolicies

  @JsonProperty
  var _currentDue : CurrencyDTO as CurrentDue

  @JsonProperty
  var _pastDue : CurrencyDTO as PastDue

  @JsonProperty
  var _totalDue : CurrencyDTO as TotalDue

  @JsonProperty
  var _unbilled : CurrencyDTO as Unbilled

}
