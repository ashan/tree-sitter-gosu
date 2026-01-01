package edge.capabilities.policychange.lob.personalauto.draft.util

uses edge.capabilities.policychange.lob.personalauto.draft.dto.DriverDTO
uses edge.capabilities.quote.person.dto.PersonDTO
uses typekey.AccountContactRole

class DriverUtil {
  static function toDTO(d:PolicyDriver):DriverDTO {
    var dto = new DriverDTO()
    var driverRole = d.AccountContactRole.AccountContact.getRole(AccountContactRole.TC_DRIVER) as Driver

    dto.FixedId = d.FixedId.Value
    dto.DisplayName = d.DisplayName
    dto.Person = new PersonDTO() {
      : FirstName = d.FirstName,
      : LastName = d.LastName
    }
    dto.DateOfBirth = d.DateOfBirth
    dto.Gender = (d.AccountContactRole.AccountContact.Contact as Person).Gender
    dto.LicenseNumber = d.LicenseNumber
    dto.LicenseState = d.LicenseState
    dto.YearLicensed =  driverRole.YearLicensed
    dto.Accidents = d.NumberOfAccidents
    dto.Violations = d.NumberOfViolations
    dto.isPolicyHolder = d.Branch.PrimaryNamedInsured.ContactDenorm == d.ContactDenorm
    DriverPlatformUtil.toDtoKanjiFields(dto, d)
    return dto
  }

  static function toUnassignedDriverDTO(d:AccountContact):DriverDTO {
    var dto = new DriverDTO()
    var person = d.Contact as Person
    dto.TempID = d.PublicID
    dto.DisplayName = d.DisplayName
    dto.Person = new PersonDTO(){
      : FirstName = person.FirstName,
      : LastName = person.LastName
    }
    dto.DateOfBirth = person.DateOfBirth
    dto.Gender = person.Gender
    DriverPlatformUtil.toDtoPersonKanjiFields(dto, person)
    return dto
  }

  static function fill(d:PolicyDriver, dto:DriverDTO) {
    var driverRole = d.AccountContactRole.AccountContact.getRole(AccountContactRole.TC_DRIVER) as Driver

    d.FirstName = dto.Person.FirstName
    d.LastName = dto.Person.LastName
    d.DateOfBirth = dto.DateOfBirth
    d.LicenseNumber = dto.LicenseNumber
    d.LicenseState = dto.LicenseState
    d.NumberOfViolations = dto.Violations
    d.NumberOfAccidents = dto.Accidents
    driverRole.NumberofViolations = dto.Violations
    driverRole.NumberofAccidents = dto.Accidents
    DriverPlatformUtil.fillKanjiFields(d, dto)

    var driverPerson = d.AccountContactRole.AccountContact.Contact as Person
    if ( d.BasedOn == null || driverPerson.Gender == null ) {
      driverPerson.Gender =  dto.Gender
    }
    if ( d.BasedOn == null || driverRole.YearLicensed == null ) {
      driverRole.YearLicensed = dto.YearLicensed
    }
  }
}
