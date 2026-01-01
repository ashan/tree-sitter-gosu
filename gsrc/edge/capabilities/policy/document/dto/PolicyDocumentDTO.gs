package edge.capabilities.policy.document.dto
uses java.lang.Boolean
uses java.lang.String
uses edge.capabilities.document.dto.DocumentBaseDTO
uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

/** Information about policy document. */
final class PolicyDocumentDTO extends DocumentBaseDTO {

  @JsonProperty @Required
  var _policyNumber : String as PolicyNumber
  
  @JsonProperty
  var _canDelete : Boolean as CanDelete

  @JsonProperty
  var _isAuthor : Boolean as IsAuthor
  
  /**
   * This one is working. Unlike inherited PublicID.
   */
  @JsonProperty 
  var _workingPublicID : String as WorkingPublicID
  
  construct()  {
  }

}
