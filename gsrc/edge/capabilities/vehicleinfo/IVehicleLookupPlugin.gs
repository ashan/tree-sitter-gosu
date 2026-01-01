package edge.capabilities.vehicleinfo

uses edge.capabilities.vehicleinfo.dto.VehicleInfoLookupDTO
uses edge.capabilities.vehicleinfo.dto.VehicleInfoLookupResultDTO
uses edge.capabilities.vehicleinfo.dto.VehicleInfoLookupResultsDTO

/**
 * Plugin used to look up vehicle information.
 */
interface IVehicleLookupPlugin {
  public function lookupBasedOnVin(vin : String) : VehicleInfoLookupResultDTO
  public function lookupBasedOnRegistration(reg : String) : VehicleInfoLookupResultDTO
  public function lookupBasedOnDTO(dto : VehicleInfoLookupDTO) : VehicleInfoLookupResultDTO
  public function lookupBasedOnPartialDTO(dto : VehicleInfoLookupDTO) : VehicleInfoLookupResultsDTO
  public function lookupMakes() : VehicleInfoLookupResultsDTO
}
