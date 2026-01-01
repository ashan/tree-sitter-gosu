package edge.capabilities.quote.lob.personalauto.quoting.dto

uses edge.jsonmapper.JsonProperty

/**
 * Personal auto data extension.
 */
enhancement PaQuoteLobDataDTOEnhancement : edge.capabilities.quote.lob.dto.QuoteLobDataDTO {
  @JsonProperty
  property get PersonalAuto() : PaAvailableCoveragesDTO {
    return this.lobExtensions.get(typekey.PolicyLine.TC_PERSONALAUTOLINE) as PaAvailableCoveragesDTO
  }

  @JsonProperty
  property set PersonalAuto(data : PaAvailableCoveragesDTO) {
    this.lobExtensions.put(typekey.PolicyLine.TC_PERSONALAUTOLINE, data)
  }

}
