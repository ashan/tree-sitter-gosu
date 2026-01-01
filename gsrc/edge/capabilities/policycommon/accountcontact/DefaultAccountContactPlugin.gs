package edge.capabilities.policycommon.accountcontact

uses edge.capabilities.address.IAddressPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.policycommon.accountcontact.dto.AccountContactDTO
uses edge.time.LocalDateUtil

class DefaultAccountContactPlugin implements IAccountContactPlugin{

  private var _addressPlugin: IAddressPlugin


  @ForAllGwNodes
  @Param("addressPlugin", "Plugin used to handle address conversion")
  construct(addressPlugin: IAddressPlugin) {
    this._addressPlugin = addressPlugin
  }

  override function toDTO(contact : Contact): AccountContactDTO {
    final var dto = new AccountContactDTO()
    fillContact(contact, dto)
    if (contact.Subtype == typekey.Contact.TC_PERSON){
      fillPersonFields(contact as Person,dto)
    }
    return dto
  }

  private function fillContact(aContact : Contact, dto : AccountContactDTO){
    dto.PublicID = aContact.PublicID
    dto.Subtype = aContact.Subtype.Code
    dto.DisplayName = aContact.DisplayName
    dto.ContactName = aContact.Name
    dto.ContactNameKanji = aContact.NameKanji
    dto.PrimaryPhoneType = aContact.PrimaryPhone
    dto.HomeNumber = aContact.HomePhone
    dto.WorkNumber = aContact.WorkPhone
    dto.FaxNumber = aContact.FaxPhone
    dto.EmailAddress1 = aContact.EmailAddress1
    dto.Subtype = aContact.Subtype.Code
    dto.AccountHolder = true

    if(aContact.PrimaryAddress != null){
      dto.PrimaryAddress = _addressPlugin.toDto(aContact.PrimaryAddress)
      if (dto.PrimaryAddress.AddressType == null){
         if (aContact.Subtype == typekey.Contact.TC_PERSON){
            dto.PrimaryAddress.AddressType = AddressType.TC_HOME
         } else if(aContact.Subtype == typekey.Contact.TC_COMPANY){
            dto.PrimaryAddress.AddressType = AddressType.TC_BUSINESS
         }
      }
    }
  }

  private function fillPersonFields(aPerson: Person, dto: AccountContactDTO) {
    dto.FirstName = aPerson.FirstName
    dto.LastName = aPerson.LastName
    dto.MiddleName = aPerson.MiddleName
    dto.Prefix = aPerson.Prefix
    dto.Suffix = aPerson.Suffix
    dto.Particle = aPerson.Particle
    dto.FirstNameKanji = aPerson.FirstNameKanji
    dto.LastNameKanji = aPerson.LastNameKanji
    dto.CellNumber = aPerson.CellPhone
    dto.MaritalStatus = aPerson.MaritalStatus
    dto.DateOfBirth = LocalDateUtil.toDTO(aPerson.DateOfBirth)

    //due to rule added to the PersonDTO we need to avoid setting the primary phone type to home if homephone is not set
    if(!(!aPerson.HomePhone.NotBlank && aPerson.PrimaryPhone == PrimaryPhoneType.TC_HOME)){
      dto.PrimaryPhoneType = aPerson.PrimaryPhone
    }
  }

  override function updateContact(contact: Contact, dto: AccountContactDTO) {
    contact.Name = dto.ContactName
    contact.NameKanji = dto.ContactNameKanji
    contact.PrimaryPhone = dto.PrimaryPhoneType
    contact.HomePhone = dto.HomeNumber
    contact.WorkPhone = dto.WorkNumber
    contact.EmailAddress1 = dto.EmailAddress1

    if(contact.PrimaryAddress == null){
      contact.PrimaryAddress = new Address()
    }
    _addressPlugin.updateFromDTO(contact.PrimaryAddress, dto.PrimaryAddress)

    if (contact.Subtype == typekey.Contact.TC_PERSON){
      updatePersonData(contact as Person, dto)
    }
  }

  /**
   * Updates base contact data. It updates primitive (integers, strings, dates, typelists) fields present in the OOB
   * portals. This method skips a public ID property.
   * @param person entity to update from the <code>dto</code>.
   * @param dto dto with data to be copied into <code>person</code> entity.
   */
  private function updatePersonData(person : Person, dto : AccountContactDTO) {
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
    person.FirstNameKanji = dto.FirstNameKanji
    person.Particle = dto.Particle
    person.LastNameKanji = dto.LastNameKanji
  }

}
