package edge.capabilities.policy.lob.personalauto.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Size
uses edge.capabilities.policy.dto.CoverageDTO
uses edge.aspects.validation.annotations.Required

/**
 * Information about one covered vehicle.
 */
class CoveredVehicleDTO {
  @JsonProperty @Required
  var _make : String as make

  @JsonProperty @Required
  var _model : String as model

  @JsonProperty @Required
  var _year : int as year

  @JsonProperty @Size(0, 40) 
  var _licensePlate : String as LicensePlate 

  @JsonProperty
  var _coverages : CoverageDTO[] as Coverages

  construct() {

  }

}
