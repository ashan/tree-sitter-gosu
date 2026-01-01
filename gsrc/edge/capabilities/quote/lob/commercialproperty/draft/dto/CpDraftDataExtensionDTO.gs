package edge.capabilities.quote.lob.commercialproperty.draft.dto


uses edge.aspects.validation.annotations.Required
uses edge.capabilities.quote.lob.commercialproperty.quoting.dto.BuildingCoverageDTO
uses edge.capabilities.quote.lob.dto.IDraftLobExtensionDTO
uses edge.jsonmapper.JsonProperty

class CpDraftDataExtensionDTO implements IDraftLobExtensionDTO {
  @JsonProperty
  var _locations : LocationDTO[] as Locations

  @JsonProperty @Required
  var _accountOrgType : AccountOrgType as AccountOrgType

  @JsonProperty
  var _buildingCovs : BuildingCoverageDTO[] as BuildingCoverages

}
