package edge.capabilities.quote.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.PostalCode

/** Used by the frontend as a DTO to call services with. */
class QuoteRetrievalDTO {

  @JsonProperty @Required @PostalCode
  var _postalCode : String as PostalCode  
  
  @JsonProperty @Required
  var _quoteID : String as QuoteID
     
  construct() {}

}
