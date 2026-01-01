package edge.capabilities.policychange.dto
uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.currency.dto.AmountDTO
uses edge.aspects.validation.annotations.Required

/**
 * Information about single coverage.
 */
class CoverageDTO {

  @JsonProperty
  var _name : String as Name

  @JsonProperty
  var _effectiveDate : Date   as EffectiveDate

  @JsonProperty
  var _expirationDate : Date as ExpirationDate

  @JsonProperty
  var _limit : String as Limit

  @JsonProperty
  var _deductible : String as Deductible

  @JsonProperty @Required
  var _premium : AmountDTO as Premium = new AmountDTO()
}
