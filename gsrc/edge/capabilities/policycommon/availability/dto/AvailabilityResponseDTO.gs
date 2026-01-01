package edge.capabilities.policycommon.availability.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.address.dto.AddressDTO
uses java.util.Date
uses edge.aspects.validation.annotations.Required

class AvailabilityResponseDTO {
    
  @JsonProperty @Required
  var _isAvailable : boolean as IsAvailable
  
  @JsonProperty @Required
  var _availableInFuture : Date as AvailableInFuture //to account for a situation where we cannot quote now but could in say, a month
  
  /* Autocompletion data for zip code. */
  @JsonProperty
  var _addressCompletion : AddressDTO as AddressCompletion
  
  construct(){}
    
}
