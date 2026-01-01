package edge.capabilities.quote.lob.commercialproperty.quoting.dto

uses edge.jsonmapper.JsonProperty

enhancement CpQuoteLobDataDTOEnhancement : edge.capabilities.quote.lob.dto.QuoteLobDataDTO {
  @JsonProperty
  property get CommercialProperty() : CpAvailableCoveragesDTO {
    return this.lobExtensions.get(typekey.PolicyLine.TC_COMMERCIALPROPERTYLINE) as CpAvailableCoveragesDTO
  }

  @JsonProperty
  property set CommercialProperty(data : CpAvailableCoveragesDTO) {
    this.lobExtensions.put(typekey.PolicyLine.TC_COMMERCIALPROPERTYLINE, data)
  }
}
