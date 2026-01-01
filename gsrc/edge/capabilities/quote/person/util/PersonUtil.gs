package edge.capabilities.quote.person.util

uses java.lang.UnsupportedOperationException
uses edge.capabilities.quote.person.dto.PersonDTO
uses edge.exception.DtoValidationException
uses edge.time.LocalDateUtil

/**
 * Utilities for the Person entity and PersonDTO dto.
 */
final class PersonUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }

  /**
   * Fills-in simple properties on the person DTO.
   * This method fills simple fields (like Strings or dates) provided by the OOB Portals product.
   * @param dto dto to set fields to.
   * @param person person entity to copy fields from.
   */
  public static function fillBaseData(dto :  PersonDTO, person : Person) {
    dto.PublicID = person.PublicID
    dto.DisplayName = person.DisplayName
    dto.FirstName = person.FirstName
    dto.LastName = person.LastName
    dto.Prefix = person.Prefix
    dto.Suffix = person.Suffix
    dto.MiddleName = person.MiddleName

    //due to rule added to the PersonDTO we need to avoid setting the primary phone type to home if homephone is not set
    if(!(!person.HomePhone.NotBlank && person.PrimaryPhone == PrimaryPhoneType.TC_HOME)){
          dto.PrimaryPhoneType = person.PrimaryPhone
    }

    dto.HomeNumber = person.HomePhone
    dto.WorkNumber = person.WorkPhone
    dto.CellNumber = person.CellPhone
    dto.MaritalStatus = person.MaritalStatus
    dto.DateOfBirth = LocalDateUtil.toDTO(person.DateOfBirth)
    PersonPlatformHelper.fillBaseData(dto, person)
  }
  
  
  /**
   * Converts person to a DTO.
   * @param person person to convert into the DTO. Could not be <code>null</code>.
   * @return DTO representation with the base (primitive) properties set.
   */
  public static function toDTO(person : Person) : PersonDTO {
    final var res = new PersonDTO()
    fillBaseData(res, person)
    return res
  }
  
  
  /**
   * Updates base contact data. It updates primitive (integers, strings, dates, typelists) fields present in the OOB
   * portals. This method skips a public ID property.
   * @param person entity to update from the <code>dto</code>.
   * @param dto dto with data to be copied into <code>person</code> entity.
   */
  public static function updateBaseData(person : Person, dto : PersonDTO) {
    person.FirstName = dto.FirstName
    person.LastName = dto.LastName
    person.MiddleName = dto.MiddleName

    //due to rule added to the PersonDTO we need to avoid setting the primary phone type to home if homephone is not set
    if(!(!dto.HomeNumber.NotBlank && dto.PrimaryPhoneType == PrimaryPhoneType.TC_HOME)){
          person.PrimaryPhone = dto.PrimaryPhoneType
    }

    person.HomePhone = dto.HomeNumber
    person.WorkPhone = dto.WorkNumber
    person.CellPhone = dto.CellNumber
    person.MaritalStatus = dto.MaritalStatus
    person.Prefix = dto.Prefix
    person.Suffix = dto.Suffix
    person.DateOfBirth = LocalDateUtil.toMidnightDate(dto.DateOfBirth)
    PersonPlatformHelper.updateBaseData(person, dto)
  }
  
  /**
   * Validates person as an account holder person for the quote operation.
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>DtoValidationException</code> - if primary phone is not a home phone</dd>
   *   <dd><code>DtoValidationException</code> - if primary phone is not set</dd>
   * </dl>
   * @param person person data to validate.
   */
  public static function validateAsAccountHolderForQuote(person : PersonDTO) {
    if (person.PrimaryPhoneType != typekey.PrimaryPhoneType.TC_HOME) {
      throw new DtoValidationException() { :Message = "Bad primary phone type for the account holder in quote" }
    }
    
    if (person.HomeNumber == null) {
      throw new DtoValidationException() { :Message = "Primary phone is not set for the account holder" }
    }
  }
}
