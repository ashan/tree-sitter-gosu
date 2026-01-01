package edge.capabilities.quote.lob.personalauto.quoting.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.quote.coverage.dto.CoverageDTO
uses java.lang.Long

/** Aggregates the coverages for a vehicle in the policy .*/
class VehicleCoverageDTO {

  /** The vehicle PublicID */
  @JsonProperty
  var _publicId : String as PublicID

  /** The vehicle FixedID */
  @JsonProperty
  var _fixedId: Long as FixedId

  /** Read-only. The name of the vehicle */
  @JsonProperty // ReadOnly
  var _vehicleName : String as VehicleName

  /** Coverages for this vehicle */
  @JsonProperty
  var _covs : CoverageDTO[] as Coverages
}
