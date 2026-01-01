package edge.capabilities.quote.coverage.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.currency.dto.AmountDTO

/**
 * DTO for the coverage.
 */
class CoverageDTO {

  @JsonProperty  
  var _name : String as Name  

  @JsonProperty
  var _updated : boolean as Updated

  @JsonProperty
  var _terms : TermDTO[] as Terms   
  
  @JsonProperty
  var _selected : Boolean as Selected  
  
  @JsonProperty
  var _required : Boolean as Required  
  
  @JsonProperty
  var _publicID : String as PublicID
  
  @JsonProperty
  var _description : String as Description

  @JsonProperty
  var _amount : AmountDTO as Amount

}
