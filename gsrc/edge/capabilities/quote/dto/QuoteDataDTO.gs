package edge.capabilities.quote.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.quote.draft.dto.DraftDataDTO
uses edge.capabilities.quote.binding.dto.BindingDataDTO
uses edge.capabilities.quote.quoting.dto.QuotingDTO
uses edge.aspects.validation.annotations.Required
uses edge.jsonmapper.JsonReadOnlyProperty

class QuoteDataDTO {
 
  /* This is to identify the user as the one who started or loaded a saved quote and mitigate random submissions changing data that is not theirs*/
  @JsonProperty
  var _sessionUUID : String as SessionUUID 
  
  @JsonProperty
  var _quoteID : String as QuoteID //use this where submissionID is required
  
  @JsonProperty @Required
  var _draftData : DraftDataDTO as DraftData
    
  @JsonReadOnlyProperty
  var _quotingData :QuotingDTO as QuoteData
  
  @JsonProperty
  var _bindingData : BindingDataDTO as BindData
  
  @JsonProperty
  var _isSubmitAgent : Boolean as IsSubmitAgent
}
