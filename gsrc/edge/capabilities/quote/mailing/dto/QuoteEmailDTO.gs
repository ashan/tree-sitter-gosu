package edge.capabilities.quote.mailing.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

/**
  * GH : This DTO is used by the Quote Email feature to provide info for the template. Only passing the IDs avoids security issues with transferring identifying information,
  * and using the session ID provides a modicum of security.
  */
class QuoteEmailDTO {

  @JsonProperty @Required
  var _quoteID : String as QuoteID

  @JsonProperty @Required
  var _sessionID : String as SessionID  
}
