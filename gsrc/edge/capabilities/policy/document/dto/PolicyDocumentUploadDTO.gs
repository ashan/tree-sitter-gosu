package edge.capabilities.policy.document.dto
uses java.lang.String
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.document.dto.DocumentUploadDTO
uses edge.aspects.validation.annotations.Required

/**
 * Document upload request.
 */
class PolicyDocumentUploadDTO extends DocumentUploadDTO {
    @JsonProperty @Required
  var _policyNumber : String as PolicyNumber


}
