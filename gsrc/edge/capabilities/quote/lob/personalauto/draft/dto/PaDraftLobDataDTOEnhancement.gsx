package edge.capabilities.quote.lob.personalauto.draft.dto

uses edge.jsonmapper.JsonProperty

/**
 * Personal auto data extension.
 */
enhancement PaDraftLobDataDTOEnhancement : edge.capabilities.quote.lob.dto.DraftLobDataDTO {
  @JsonProperty
  property get PersonalAuto() : PaDraftDataExtensionDTO {
    return this.lobExtensions.get(typekey.PolicyLine.TC_PERSONALAUTOLINE) as PaDraftDataExtensionDTO
  }

  @JsonProperty
  property set PersonalAuto(data : PaDraftDataExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyLine.TC_PERSONALAUTOLINE, data)
  }
}
