package edge.capabilities.quote.lob.personalauto.draft.util

uses edge.capabilities.quote.lob.personalauto.draft.dto.DriverDTO
uses typekey.AccountContactRole
uses edge.time.LocalDateUtil

class DriverPlatformUtil {
  
  /**
   * Fills-in a platform-specific fields on the dto.
   */
  static function fill(driver : PolicyDriver, dto : DriverDTO) {
    final var accountLevel = driver.AccountContactRole.AccountContact.getRole(AccountContactRole.TC_DRIVER) as Driver

    driver.NumberOfAccidents = dto.Accidents
    accountLevel.NumberofAccidents = dto.Accidents
    
    driver.NumberOfViolations = dto.Violations
    accountLevel.NumberofViolations = dto.Violations

    var driverAsPerson = driver.AccountContactRole.AccountContact.Contact as Person
    driverAsPerson.LicenseNumber = dto.LicenseNumber
    driverAsPerson.DateOfBirth = LocalDateUtil.toMidnightDate(dto.DateOfBirth)
    driverAsPerson.Gender = dto.Gender

  }

  internal static function toDTO(driver : PolicyDriver, dto:DriverDTO) {
   var driverAsPerson = driver.ContactDenorm as Person
   dto.DateOfBirth = LocalDateUtil.toDTO(driverAsPerson.DateOfBirth)
   dto.Gender = driverAsPerson.Gender
   dto.isPolicyHolder = driver.Branch.PrimaryNamedInsured.DisplayName.equals(driver.DisplayName)
  }
}
