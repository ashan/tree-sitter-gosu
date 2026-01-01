package edge.capabilities.gpa.job.submission.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.FutureDate
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.FilterByCategory

class NewSubmissionDTO {

  @JsonProperty
  var _accountNumber : String as AccountNumber

  @JsonProperty @Required
  var _productCode : String as ProductCode

  @JsonProperty
  @FilterByCategory("Country")
  @Required
  var _state : typekey.State as State

  @JsonProperty
  var _country : typekey.Country as Country

  @JsonProperty @Required @FutureDate
  var _effectiveDate : Date as EffectiveDate

  @JsonProperty @Required
  var _producerCode : String as ProducerCode
}
