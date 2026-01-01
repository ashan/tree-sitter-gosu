package edge.capabilities.quote.lob.personalauto.draft.util

uses java.lang.UnsupportedOperationException
uses edge.capabilities.quote.person.util.PersonUtil
uses edge.capabilities.quote.lob.personalauto.draft.dto.DriverDTO
uses typekey.AccountContactRole
uses edge.time.LocalDateUtil

final class DriverUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }


  public static function toDTO(driver : PolicyDriver) : DriverDTO {
   final var res = new DriverDTO()
   
   final var accountLevel = driver.AccountContactRole.AccountContact.getRole(AccountContactRole.TC_DRIVER) as Driver

   var driverAsPerson = driver.ContactDenorm as Person
   res.Person = PersonUtil.toDTO(driverAsPerson)
   res.YearLicensed = accountLevel.YearLicensed
   res.Accidents = accountLevel.NumberofAccidents
   res.Violations = accountLevel.NumberofViolations
   res.LicenseState = driver.LicenseState
   res.LicenseNumber = driver.LicenseNumber
   res.PublicID = driver.PublicID
   DriverPlatformUtil.toDTO(driver, res)
    
    return res
  }
  
  
  public static function fill(driver : PolicyDriver, dto : DriverDTO) {
    final var accountLevel = driver.AccountContactRole.AccountContact.getRole(AccountContactRole.TC_DRIVER) as Driver

    driver.DateOfBirth = LocalDateUtil.toMidnightDate(dto.DateOfBirth)
    driver.LicenseNumber = dto.LicenseNumber
    driver.LicenseState = dto.LicenseState
    DriverPlatformUtil.fill(driver, dto)
    accountLevel.YearLicensed = dto.YearLicensed
  }
}
