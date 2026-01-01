package edge.capabilities.quote.lob.personalauto.quoting.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.quote.coverage.dto.CoverageDTO
uses edge.capabilities.quote.lob.dto.IQuoteLobExtensionDTO

/**
 * Aggregates the coverages for the PersonalAuto line of business.
 */
class PaAvailableCoveragesDTO implements IQuoteLobExtensionDTO {

  /** Vehicle coverages */
  @JsonProperty
  var _vehicleCovs : VehicleCoverageDTO[] as VehicleCoverages

  /** Policy line coverages */
  @JsonProperty
  var _lineCovs : CoverageDTO[] as LineCoverages

}
