package edge.capabilities.policy.lob.personalauto

uses edge.capabilities.policy.lob.ILobPolicyPlugin
uses edge.capabilities.policy.lob.personalauto.dto.PaPolicyExtensionDTO
uses edge.capabilities.policy.lob.util.PolicyLineUtil
uses edge.capabilities.policy.lob.personalauto.dto.DriverDTO
uses edge.capabilities.policy.dto.CoverageDTO
uses edge.capabilities.policy.lob.personalauto.dto.CoveredVehicleDTO
uses edge.capabilities.policy.lob.personalauto.util.PAPlatformUtil
uses edge.di.annotations.InjectableNode

/**
 * Default plugin implementation for retrieving Personal Auto policy information. his one ignores all
 * data for non-personal auto, so it _can_ be used with the combining/composing plugins.
 */
final class PaPolicyPlugin implements ILobPolicyPlugin <PaPolicyExtensionDTO> {

  @InjectableNode
  construct() {
  }

  override function getPolicyLineInfo(period: PolicyPeriod): PaPolicyExtensionDTO {
    final var res = new PaPolicyExtensionDTO()

    if(period.PersonalAutoLineExists) {
      final var line = period.PersonalAutoLine
      PolicyLineUtil.fillBaseProperties(res, line)
      res.CoverageDTOs = convertToDTO(line.PALineCoverages)
      res.VehicleDTOs = line.Vehicles.map(\v -> convertToDTO(v))
      res.DriverDTOs = line.PolicyDrivers.map(\ d -> convertToDTO(d))
    }
    return res;
  }

  public static function convertToDTO(vehicle : PersonalVehicle) : CoveredVehicleDTO {
    final var res = new CoveredVehicleDTO()
    res.make = vehicle.Make
    res.model = vehicle.Model
    res.year = vehicle.Year
    res.LicensePlate = vehicle.LicensePlate
    res.Coverages = convertToDTO(vehicle.Coverages)

    return res
  }


  public static function convertToDTO(driver : PolicyDriver) : DriverDTO {
    final var res = new DriverDTO()
    res.FirstName = driver.FirstName
    res.LastName = driver.LastName
    res.DisplayName = driver.DisplayName
    res.LicenseNumber = driver.LicenseNumber
    res.LicenseState = driver.LicenseState
    res.DateOfBirth = PAPlatformUtil.getDOB(driver)
    return res
  }


  public static function convertToDTO(coverages : Coverage[]) : CoverageDTO[] {
    return coverages.map(\ cov -> PolicyLineUtil.createBaseCoverage(cov, costsOf(cov)))
  }


  /**
   * Finds costs for the personalauto-based coverage.
   */
  public static function costsOf(coverage : Coverage) : Cost[] {
    if (coverage typeis PersonalAutoCov) {
      return coverage.Costs
    } else if (coverage typeis BusinessAutoCov) {
      return PAPlatformUtil.businessAutoCov(coverage)
    } else if (coverage typeis PersonalVehicleCov) {
      return coverage.Costs
    } else if (coverage typeis BusinessVehicleCov) {
      return coverage.Costs
    }
    return new Cost[0]
  }
}
