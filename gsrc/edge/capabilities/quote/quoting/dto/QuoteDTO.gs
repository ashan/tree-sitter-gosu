package edge.capabilities.quote.quoting.dto

uses edge.aspects.validation.annotations.FutureDate
uses edge.aspects.validation.annotations.Required
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.quote.lob.dto.QuoteLobDataDTO
uses java.util.Date

class QuoteDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty   // ReadOnly
  var _branchName : String as BranchName

  @JsonProperty   // ReadOnly
  var _branchCode : String as BranchCode

  @JsonProperty
  var _isCustom : Boolean as IsCustom

  @JsonProperty   // ReadOnly
  var _total : AmountDTO as Total

  @JsonProperty   // ReadOnly
  var _monthlyPremium : AmountDTO as MonthlyPremium

  @JsonProperty   // ReadOnly
  var _termMonths : int as TermMonths

  @JsonProperty   // ReadOnly
  var _taxes : AmountDTO as Taxes

  @JsonProperty   // ReadOnly
  var _totalBeforeTaxes : AmountDTO as TotalBeforeTaxes

  @JsonProperty
  var _lobs : QuoteLobDataDTO as Lobs

  @JsonProperty
  var _quoteID : String as QuoteID

  @JsonProperty @Required
  @FutureDate
  var _periodStartDate : Date as PeriodStartDate

  @JsonProperty @FutureDate
  var _periodEndDate : Date as PeriodEndDate

  @JsonProperty
  var _hasBlockingUWIssues : Boolean as HasBlockingUWIssues

}
