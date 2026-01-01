package edge.capabilities.policychange.lob.personalauto.draft.util

uses edge.capabilities.policychange.lob.personalauto.draft.dto.VehicleDTO
uses edge.capabilities.currency.dto.AmountDTO

class VehicleUtil {
  static function toDto(v:PersonalVehicle):VehicleDTO {
    var res = new VehicleDTO()

    res.DisplayName = v.DisplayName
    res.VehicleNumber = v.VehicleNumber
    res.Make = v.Make
    res.Model = v.Model
    res.Year = v.Year
    res.License = v.LicensePlate
    res.CostNew = AmountDTO.fromMonetaryAmount(v.CostNew)
    res.LicenseState = v.LicenseState
    res.Vin = v.Vin
    res.FixedId = v.FixedId.Value
    return res
  }

  static function fill(d:PersonalVehicle, dto:VehicleDTO) {
    d.Make = dto.Make
    d.Model = dto.Model
    d.Year = dto.Year
    d.LicensePlate = dto.License
    d.LicenseState = dto.LicenseState
    d.Vin = dto.Vin
    d.CostNew = dto.CostNew.toMonetaryAmount()
  }
}
