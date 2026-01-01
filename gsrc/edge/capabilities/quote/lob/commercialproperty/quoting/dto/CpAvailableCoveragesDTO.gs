package edge.capabilities.quote.lob.commercialproperty.quoting.dto

uses edge.capabilities.quote.lob.dto.IQuoteLobExtensionDTO
uses edge.jsonmapper.JsonProperty

class CpAvailableCoveragesDTO implements IQuoteLobExtensionDTO {
  /** Building coverages */
  @JsonProperty
  var _buildingCovs : BuildingCoverageDTO[] as BuildingCoverages
}
