package edge.capabilities.quote.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.quote.quoting.dto.QuoteDTO

/** Frontend->Backend data. */
class CustomQuoteDTO {
 
  /* This is to identify the user as the one who started or loaded a saved quote and mitigate random submissions changing data that is not theirs*/
  @JsonProperty
  var _sessionUUID : String as SessionUUID 
  
  @JsonProperty
  var _quoteID : String as QuoteID //use this where submissionID is required
  

  @JsonProperty
  var _quote : QuoteDTO as Quote
}
