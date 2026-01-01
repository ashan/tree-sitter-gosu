package edge.capabilities.quote.lob.commercialproperty.draft.dto

uses edge.jsonmapper.JsonProperty

enhancement CpDraftLobDataDTOEnhancement : edge.capabilities.quote.lob.dto.DraftLobDataDTO {
  @JsonProperty
  property get CommercialProperty() : CpDraftDataExtensionDTO {
    return this.lobExtensions.get(typekey.PolicyLine.TC_COMMERCIALPROPERTYLINE) as CpDraftDataExtensionDTO
  }


  @JsonProperty
  property set CommercialProperty(v : CpDraftDataExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyLine.TC_COMMERCIALPROPERTYLINE, v)
  }
}
