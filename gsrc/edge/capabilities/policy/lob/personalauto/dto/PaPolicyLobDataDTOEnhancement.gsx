package edge.capabilities.policy.lob.personalauto.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.policy.lob.dto.PolicyLobDataDTO

enhancement PaPolicyLobDataDTOEnhancement : PolicyLobDataDTO {

  @JsonProperty
  property get PersonalAuto() : PaPolicyExtensionDTO {
    return this.lobExtensions.get(typekey.PolicyLine.TC_PERSONALAUTOLINE) as PaPolicyExtensionDTO
  }

  @JsonProperty
  property set PersonalAuto(data : PaPolicyExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyLine.TC_PERSONALAUTOLINE, data)
  }

}
