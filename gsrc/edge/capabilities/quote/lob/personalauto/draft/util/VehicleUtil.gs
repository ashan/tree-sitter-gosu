package edge.capabilities.quote.lob.personalauto.draft.util

uses java.lang.UnsupportedOperationException
uses edge.capabilities.quote.lob.personalauto.draft.dto.VehicleDTO
uses edge.util.helper.CurrencyOpUtil
uses edge.capabilities.currency.dto.AmountDTO

final class VehicleUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }
  
  
  /**
   * Converts vehicle to vehicle DTO.
   */
  public static function toDTO(vehicle : PersonalVehicle) : VehicleDTO {
    final var res = new VehicleDTO()
    
    res.License = vehicle.LicensePlate
    res.Year = vehicle.Year
    res.Make = vehicle.Make
    res.Model = vehicle.Model
    res.Vin = vehicle.Vin
    res.AnnualMileage = vehicle.AnnualMileage
    res.LeaseOrRent = vehicle.LeaseOrRent
    res.LengthOfLease = vehicle.LengthOfLease
    res.CommutingMiles = vehicle.CommutingMiles
    res.PrimaryUse = vehicle.PrimaryUse
    
    res.LicenseState = vehicle.LicenseState
    res.CostNew = AmountDTO.fromMonetaryAmount(vehicle.CostNew)
    res.DisplayName =  vehicle.Make + " " + vehicle.Model + " " + vehicle.Year
    res.PublicID = vehicle.PublicID
    
    return res
  }
  
  
  /**
   * Fills a vehicle using information from the DTO.
   */
  public static function fill(vehicle : PersonalVehicle, dto : VehicleDTO) {
    vehicle.LicensePlate = dto.License
    vehicle.Year = dto.Year
    vehicle.Make = dto.Make
    vehicle.Model = dto.Model
    vehicle.Vin = dto.Vin
    vehicle.AnnualMileage = dto.AnnualMileage
    vehicle.LeaseOrRent = dto.LeaseOrRent
    vehicle.LengthOfLease = dto.LengthOfLease
    vehicle.CommutingMiles = dto.CommutingMiles
    vehicle.PrimaryUse = dto.PrimaryUse
    
    vehicle.LicenseState = dto.LicenseState
    vehicle.CostNew = dto.CostNew.toMonetaryAmount()
  }

}
