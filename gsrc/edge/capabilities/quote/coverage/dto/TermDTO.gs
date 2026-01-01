package edge.capabilities.quote.coverage.dto
uses edge.jsonmapper.JsonProperty
uses java.math.BigDecimal

class TermDTO {

  @JsonProperty  // ReadOnly
  var _name : String as Name
  
  @JsonProperty
  var _patternCode : String as PatternCode
  
  @JsonProperty // ReadOnly
  var _options : TermOptionDTO[] as Options
  
  @JsonProperty
  var _chosenTerm : String as ChosenTerm
  
  @JsonProperty  // ReadOnly
  var _chosenTermValue : String as ChosenTermValue

  @JsonProperty
  var _directValue : BigDecimal as DirectValue

  @JsonProperty  // ReadOnly
  var _isAscendingBetter : Boolean as isAscendingBetter//whether the higher options are better

  @JsonProperty
  var _updated : boolean as Updated

  @JsonProperty
  var _valueType : String as ValueType
}
