package edge.capabilities.policychange.lob.personalauto.draft.dto

uses edge.jsonmapper.JsonProperty

uses java.lang.Long

/**
 * Used to represent the association between vehicles and drivers on a policy.
 * VehicleDriverDTO has no percentage assigned information, it gets initialized to 0 when a new assignment is created (but keeps its existing value when it's updated).
 * Driver assignment percentages are adjusted to make 100% before quoting a policy change.
*/
class VehicleDriverDTO {

  /** The driver's TempID, must be null if the driver's FixedID is not null */
  @JsonProperty
  var _driverTempId : String as DriverTempID

  /** The vehicle's TempId, must be null if the vehicle's FixedID is not null */
  @JsonProperty
  var _vehicleTempId : String as VehicleTempID

  /** The driver's FixedID, must be null for new drivers. */
  @JsonProperty
  var _driverId : Long as DriverID

  /** The vehicle's FixedID, must be null for new vehicles */
  @JsonProperty
  var _vehicleId : Long as VehicleID
}
