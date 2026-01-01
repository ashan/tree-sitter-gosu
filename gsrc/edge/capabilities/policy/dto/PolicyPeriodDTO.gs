package edge.capabilities.policy.dto
uses edge.capabilities.policy.document.dto.PolicyDocumentDTO
uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Size
uses edge.capabilities.policy.lob.dto.PolicyLobDataDTO
uses java.lang.Boolean

class PolicyPeriodDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _documentDTOs : PolicyDocumentDTO[] as DocumentDTOs

  @JsonProperty
  var _canUploadDocument : Boolean as CanUploadDocument

  @JsonProperty
  var _effective : Date   as Effective

  @JsonProperty
  var _expiration : Date as Expiration

  @JsonProperty @Size(0, 50)
  var _idCardPublicID : String as idCardPublicID

  @JsonProperty @Size(0,40)
  var _idCardSessionID : String as idCardSessionID

  @JsonProperty
  var _lobs : PolicyLobDataDTO as Lobs

  construct() {

  }

}
