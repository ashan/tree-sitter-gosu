package edge.capabilities.vehicleinfo

uses edge.jsonrpc.IRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.capabilities.vehicleinfo.dto.VehicleInfoLookupResultDTO
uses edge.capabilities.vehicleinfo.dto.VehicleInfoLookupResultsDTO
uses edge.capabilities.vehicleinfo.dto.VehicleInfoLookupDTO


/**
 * Vin Lookup handler, used to implement vehicle info lookup.<br>
 *
 * Three methods are supported, lookup by VIN, Registration and Make/Model/Year.
 * Note that the plugin used is a mock service and that customers are expected to implement proper
 * lookup service integration in an IVehicleLookupPlugin implementation.
 */
class VehicleInfoLookupHandler implements IRpcHandler {

  private var _lookupPlugin : IVehicleLookupPlugin

  @InjectableNode
  @Param("lookupPlugin", "Plugin used to obtain vehicle information")
  construct(lookupPlugin : IVehicleLookupPlugin) {
    this._lookupPlugin = lookupPlugin
  }

  /**
   * Provides some vehicle information given a VIN number
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the given VIN was null</dd>
   * </dl>
   *
   * @param vin a VIN number
   * @return details for a vehicle identified by the VIN given
   */
  @JsonRpcUnauthenticatedMethod
  public function lookupBasedOnVIN( vin : String ) : VehicleInfoLookupResultDTO {
    return _lookupPlugin.lookupBasedOnVin(vin)
  }

  /**
   * Provides some vehicle information given a registration number
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the given registration was null</dd>
   * </dl>
   *
   * @param reg a registration number
   * @return details for a vehicle identified by the registration given
   */
  @JsonRpcUnauthenticatedMethod
  public function lookupBasedOnRegistration( reg : String ) : VehicleInfoLookupResultDTO {
    return _lookupPlugin.lookupBasedOnRegistration(reg)
  }

  /**
   * Provides some vehicle information given a VehicleInfoLookupDTO
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the given VehicleInfoLookupDTO was null</dd>
   * </dl>
   *
   * @param dto a VehicleInfoLookupDTO
   * @return details for a vehicle identified by the DTO given
   */
  @JsonRpcUnauthenticatedMethod
  public function lookupBasedOnDTO( dto : VehicleInfoLookupDTO) : VehicleInfoLookupResultDTO {
    return _lookupPlugin.lookupBasedOnDTO(dto)
  }

  /**
   * Provides a list of vehicle information given a partially completed VehicleInfoLookupDTO
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the given VehicleInfoLookupDTO was null</dd>
   * </dl>
   *
   * @param dto a VehicleInfoLookupDTO
   * @return details for a vehicle identified by the DTO given
   */
  @JsonRpcUnauthenticatedMethod
  public function lookupBasedOnPartialDTO( dto : VehicleInfoLookupDTO) : VehicleInfoLookupResultsDTO {
    return _lookupPlugin.lookupBasedOnPartialDTO(dto)
  }

  /**
   * Provides a list of vehicle makes
   *
   * @return a list of vehicle makes
   */
  @JsonRpcUnauthenticatedMethod
  public function lookupMakes( ) : VehicleInfoLookupResultsDTO {
    return _lookupPlugin.lookupMakes()
  }
}
