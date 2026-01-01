package edge.capabilities.vehicleinfo

uses edge.capabilities.vehicleinfo.dto.VehicleInfoLookupDTO
uses java.util.HashMap
uses java.lang.IllegalArgumentException
uses edge.capabilities.vehicleinfo.dto.VehicleInfoLookupResultDTO
uses edge.capabilities.vehicleinfo.dto.VehicleInfoLookupResultsDTO
uses edge.capabilities.currency.dto.AmountDTO
uses java.math.BigDecimal
uses edge.di.annotations.ForAllGwNodes
uses java.util.HashSet
uses java.lang.Integer

class SampleVehicleLookupPlugin implements IVehicleLookupPlugin {

  /**
   * Stub implementation of vehicle data. In production, the functions should call the
   * appropriate service to obtain data.
   *
   * Any implementation should handle errors from the plugin appropriately. VinLookupResultDTO
   * contains error code and description fields for this purpose.
   */
  private final var _vehicleInfoMap = new HashMap<String,Object>[] {
  new HashMap<String,Object>(){
    "Make" -> "Toyota", "Model" -> "Avensis", "Year" ->2013,
    "Trim" -> "T2", "Variant" -> "4Dr", "Cost" -> 5000.00,
    "FuelType" -> "Diesel", "Vin" -> "123456789", "Reg" -> "EX4PLATE",
    "ISO1" -> "abcd", "ISO2" -> "defgh"
  },
  new HashMap<String,Object>(){
    "Make" -> "Chevrolet", "Model" -> "Suburban", "Year" ->2010,
    "Trim" -> "L2", "Variant" -> "4WD", "Cost" -> 5000.00,
    "FuelType" -> "Diesel", "Vin" -> "1234560987", "Reg" -> "EX2PLATE",
    "ISO1" -> "ijkl", "ISO2" -> "mnop"
  },
  new HashMap<String,Object>(){
    "Make" -> "Ford", "Model" -> "Focus", "Year" ->2014,
    "Trim" -> "SE", "Variant" -> "2WD", "Cost" -> 7000.00,
    "FuelType" -> "Petrol", "Vin" -> "1234561122", "Reg" -> "EX1PLATE",
    "ISO1" -> "qrst", "ISO2" -> "uvwx"
  },
  new HashMap<String,Object>(){
    "Make" -> "Chevrolet", "Model" -> "Suburban", "Year" ->2010,
    "Trim" -> "LS", "Variant" -> "2WD", "Cost" -> 9000.00,
    "FuelType" -> "Petrol", "Vin" -> "1234569870", "Reg" -> "EX3PLATE",
    "ISO1" -> "yz12", "ISO2" -> "3456"
  },
  new HashMap<String,Object>(){
    "Make" -> "Lexus", "Model" -> "430", "Year" ->2011,
    "Trim" -> "LS", "Variant" -> "2WD", "Cost" -> 9000.00,
    "FuelType" -> "Petrol", "Vin" -> "1234569870", "Reg" -> "EX3PLATE",
    "ISO1" -> "7890", "ISO2" -> "a1b2"
  }
  }

  private final var makeModelMap = new HashMap<String, String[]>() {
    "BMW" -> new String[] {"i3", "i8", "M3", "M5"},
    "Audi" -> new String[] {"A3", "A4", "A5", "A6", "A7"},
    "Chevrolet" -> new String[] {"Astro", "Avalanche", "Cobalt", "Tahoe", "Tracker"},
    "Ford" -> new String[] {"Aspire", "Bronco", "Fiesta", "Focus"},
    "Toyota" -> new String[] {"Avensis"},
    "Chevrolet" -> new String[] {"Suburban"},
    "Lexus" -> new String[] {"430"}
  }

  private final var vehicleYears = {"2015", "2014", "2013", "2012"}


  @ForAllGwNodes
  construct(){}

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
  override function lookupBasedOnVin(vin: String) : VehicleInfoLookupResultDTO{
    if (vin == null){
      throw new IllegalArgumentException("Null VIN passed to VinLookupHandler")
    }

    var vehicle = _vehicleInfoMap.where( \ elt -> elt.get("Vin") == vin)
    if (vehicle.length == 1){
      return toDTO(vehicle.first())
    } else {
      return new VehicleInfoLookupResultDTO(){
          :ErrorCode = "1",
          :ErrorDescription = vehicle.IsEmpty ? "The given vehicle could not be found" : "Vehicle information was not unique"}
    }
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
  override function lookupBasedOnRegistration(reg: String) : VehicleInfoLookupResultDTO {
    if (reg == null){
      throw new IllegalArgumentException("Null registration passed to VinLookupHandler")
    }

    var vehicle = _vehicleInfoMap.where( \ elt -> elt.get("Reg") == reg)
    if (vehicle.length == 1){
      return toDTO(vehicle.first())
    } else {
      return new VehicleInfoLookupResultDTO(){
          :ErrorCode = "1",
          :ErrorDescription = vehicle.IsEmpty ? "The given vehicle could not be found" : "Vehicle information was not unique"}
    }
  }

  /**
   * Provides some vehicle information given a VehicleInfoLookupDTO.
   *
   * Make/Model/Year is used as an example, but in practice any combination of fields is acceptable as criteria.
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the given DTO was null</dd>
   * </dl>
   *
   * @param dto a VehicleInfoLookupDTO
   * @return details for a vehicle identified by the DTO given
   */
  override function lookupBasedOnDTO(dto: VehicleInfoLookupDTO) : VehicleInfoLookupResultDTO {
    if (dto == null){
      throw new IllegalArgumentException("Null DTO passed to VinLookupHandler")
    }

    var vehicle = _vehicleInfoMap.where( \ elt -> elt.get("Make") == dto.Make && elt.get("Model") == dto.Model&& elt.get("Year") == dto.Year)
    if (vehicle.length == 1){
      return toDTO(vehicle.first())
    } else {
      return new VehicleInfoLookupResultDTO(){
        :ErrorCode = "1",
        :ErrorDescription = vehicle.IsEmpty ? "The given vehicle could not be found" : "Vehicle information was not unique"}
    }
  }

  /**
   * Provides a list of vehicle information given a VehicleInfoLookupDTO.
   *   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the given DTO was null</dd>
   * </dl>
   *
   * @param dto a VehicleInfoLookupDTO
   * @return list of details for a vehicle identified by the DTO given
   */
  override function lookupBasedOnPartialDTO(dto: VehicleInfoLookupDTO) : VehicleInfoLookupResultsDTO {
    if (dto == null){
      throw new IllegalArgumentException("Null DTO passed to VinLookupHandler")
    }

    var vehicles = new HashMap<String,String[]>()
    if(dto.Make != null and dto.Model != null and makeModelMap.containsKey(dto.Make) and makeModelMap[dto.Make].contains(dto.Model)) {
      vehicles["Years"] = vehicleYears.toTypedArray()
    }
    else if(dto.Make != null and dto.Model == null and makeModelMap.containsKey(dto.Make) and (dto.Year == null or vehicleYears.contains(dto.Year as String))) {
      vehicles["Models"] = makeModelMap[dto.Make]
    }
    else if(dto.Year != null and vehicleYears.contains(dto.Year as String) and dto.Make == null) {
      vehicles["Makes"] = makeModelMap.keySet().toTypedArray()
    }

    if(vehicles.Empty) {
      return new VehicleInfoLookupResultsDTO(){
          :ErrorCode = "1",
          :ErrorDescription = "A suitable vehicle match could not be found"}
    } else {
      return partialToDTO(vehicles)
    }
  }

  /**
   * Provides a list of vehicle makes
   *
   * @return list of vehicle makes
   */
  override function lookupMakes() : VehicleInfoLookupResultsDTO {

    var vehicles = new HashMap<String,String[]>()
    vehicles["Makes"] = makeModelMap.keySet().toTypedArray()

    if(vehicles.Empty) {
      return new VehicleInfoLookupResultsDTO(){
          :ErrorCode = "1",
          :ErrorDescription = "No vehicle makes were found"}
    } else {
      return partialToDTO(vehicles)
    }
  }

  protected function toDTO(vehicleInfo : HashMap<String,Object>) : VehicleInfoLookupResultDTO {
    final var res = new VehicleInfoLookupResultDTO ()
    res.Year = vehicleInfo.get("Year") as int
    res.Make = vehicleInfo.get("Make") as String
    res.Model = vehicleInfo.get("Model") as String
    res.Body = vehicleInfo.get("Body") as String
    res.Trim = vehicleInfo.get("Trim") as String
    res.Cost = new AmountDTO(){:Amount = vehicleInfo.get("Cost") as BigDecimal}
    res.FuelType = vehicleInfo.get("FuelType") as String
    res.Variant = vehicleInfo.get("Variant") as String
    res.Vin = vehicleInfo.get("Vin") as String
    res.Iso1 = vehicleInfo.get("ISO1") as String
    res.Iso2 = vehicleInfo.get("ISO2") as String

    return res
  }

  protected function partialToDTO(vehicleInfo : HashMap<String, String[]>) : VehicleInfoLookupResultsDTO {
    final var res = new VehicleInfoLookupResultsDTO ()
    if (vehicleInfo.containsKey("Years")) {
      res.Years = vehicleInfo.get("Years").map( \ elt -> Integer.parseInt(elt))
    }
    res.Makes = vehicleInfo.get("Makes")
    res.Models =vehicleInfo.get("Models")
    return res
  }
}
