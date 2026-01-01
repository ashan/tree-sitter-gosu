package edge.capabilities.quote.coverage.dto
uses java.lang.String
uses edge.jsonmapper.JsonProperty
uses java.lang.Integer

class TermOptionDTO {

  @JsonProperty  
  var _name : String as Name
  
  @JsonProperty
  var _code : String as Code
  
  @JsonProperty
  var _value : Integer as OptionValue
  
  @JsonProperty
  var _maxValue : Integer as MaxValue

}
