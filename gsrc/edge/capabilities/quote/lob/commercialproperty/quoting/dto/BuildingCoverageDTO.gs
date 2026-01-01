package edge.capabilities.quote.lob.commercialproperty.quoting.dto

uses edge.capabilities.currency.dto.AmountDTO
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.quote.coverage.dto.CoverageDTO
uses java.lang.Long
uses edge.capabilities.quote.lob.commercialproperty.draft.dto.BuildingDTO

class BuildingCoverageDTO {
  /** The building PublicID */
  @JsonProperty
  var _publicId : String as PublicID

  /** The building FixedID */
  @JsonProperty
  var _fixedId: Long as FixedId

  /** Read-only. The location of the building */
  @JsonProperty // ReadOnly
  var _building : BuildingDTO as Building

  /** Coverages for this building */
  @JsonProperty
  var _covs : CoverageDTO[] as Coverages

  @JsonProperty   // ReadOnly
  var _premium : AmountDTO as Premium
}
