package edge.capabilities.policychange.lob.personalauto.draft.dto

uses edge.capabilities.policychange.dto.IDraftLobExtensionDTO
uses edge.jsonmapper.JsonProperty

class PaDraftDataExtensionDTO implements IDraftLobExtensionDTO {

  /** The PolicyDrivers in the active policy period */
  @JsonProperty
  var _drivers : DriverDTO[] as Drivers

  /** The PersonalVehicles in the active policy period. */
  @JsonProperty
  var _vehicles : VehicleDTO[] as Vehicles

  /** Assignment of drivers to vehicles. */
  @JsonProperty
  var _assignments : VehicleDriverDTO [] as VehicleDrivers

  /** Drivers that are not yet assigned to a vehicle. */
  @JsonProperty
  var _availableDrivers : DriverDTO[] as AvailableDrivers

  /** When set to 'true', it will set the garaging address of all the vehicles to the policy address in the parent PolicyChangeDTO */
  @JsonProperty
  var _updateGarageLocation: Boolean as UpdateGarageLocation

}
