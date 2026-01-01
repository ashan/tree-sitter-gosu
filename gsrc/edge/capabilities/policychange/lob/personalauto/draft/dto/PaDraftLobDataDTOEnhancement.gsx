package edge.capabilities.policychange.lob.personalauto.draft.dto

uses edge.jsonmapper.JsonProperty

enhancement PaDraftLobDataDTOEnhancement : edge.capabilities.policychange.dto.DraftLobDataDTO {
  @JsonProperty
  property get PersonalAuto() : PaDraftDataExtensionDTO {
    return this.lobExtensions.get(typekey.PolicyLine.TC_PERSONALAUTOLINE) as PaDraftDataExtensionDTO
  }

  @JsonProperty
  property set PersonalAuto(data : PaDraftDataExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyLine.TC_PERSONALAUTOLINE, data)
  }
}
