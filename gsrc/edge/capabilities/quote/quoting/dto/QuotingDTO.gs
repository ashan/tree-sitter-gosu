package edge.capabilities.quote.quoting.dto

uses edge.jsonmapper.JsonProperty

/**
 * Quoting description DTO.
 */
class QuotingDTO {
  @JsonProperty
  var _offeredQuotes : QuoteDTO[] as OfferedQuotes  
}
