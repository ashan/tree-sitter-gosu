package edge.capabilities.policy.dto
uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.currency.dto.AmountDTO
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Pattern

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
  @Pattern("-?[0-9]{1,16}'\'.?[0-9]{0,2}")
  var _premium : AmountDTO as Premium = new AmountDTO()


  construct() {

  }

}
