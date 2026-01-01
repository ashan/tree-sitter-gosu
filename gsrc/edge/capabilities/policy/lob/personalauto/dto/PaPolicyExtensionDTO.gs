package edge.capabilities.policy.lob.personalauto.dto

uses edge.capabilities.policy.lob.dto.PolicyLineBaseDTO
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.dto.IPolicyLobExtensionDTO

class PaPolicyExtensionDTO extends PolicyLineBaseDTO implements IPolicyLobExtensionDTO  {
  @JsonProperty
  var _coverageDTOs : CoverageDTO[] as CoverageDTOs
  
  @JsonProperty
  var _driverDTOs : DriverDTO[] as DriverDTOs
  
  @JsonProperty
  var _vehicleDTOs : CoveredVehicleDTO[] as VehicleDTOs

}
