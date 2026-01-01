package edge.capabilities.gpa.contact

uses edge.capabilities.gpa.contact.dto.PersonDTO
uses edge.capabilities.gpa.contact.dto.CompanyDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.gpa.contact.dto.ContactBaseDTO
uses edge.util.mapping.RefUpdater
uses edge.capabilities.address.dto.AddressDTO

class DefaultContactPlugin implements IContactPlugin {

  private var _addressPlugin: IAddressPlugin


  @ForAllGwNodes
  @Param("addressPlugin", "Plugin used to handle address conversion")
  construct(addressPlugin: IAddressPlugin) {
    this._addressPlugin = addressPlugin
  }

  override function toDTO(aPerson: Person): PersonDTO {
    if(aPerson == null){
      return null
    }
    final var dto = new PersonDTO()
    fillContact(aPerson, dto)

    dto.FirstName = aPerson.FirstName
    dto.LastName = aPerson.LastName
    dto.MiddleName = aPerson.MiddleName
    dto.Prefix = aPerson.Prefix
    dto.Suffix = aPerson.Suffix
    dto.FirstNameKanji = aPerson.FirstNameKanji
    dto.LastNameKanji = aPerson.LastNameKanji
    dto.CellNumber = aPerson.CellPhone

    return dto
  }

  override function toDTO(aCompany: Company): CompanyDTO {
    if(aCompany == null){
      return null
    }
    final var dto = new CompanyDTO()
    fillContact(aCompany, dto)

    return dto
  }

  override function updateContact(aPerson: Person, dto: PersonDTO) {
    updateBaseProperties(aPerson, dto)
    aPerson.FirstName = dto.FirstName
    aPerson.LastName = dto.LastName
    aPerson.MiddleName = dto.MiddleName
    aPerson.Prefix = dto.Prefix
    aPerson.Suffix  = dto.Suffix
    aPerson.FirstNameKanji = dto.FirstNameKanji
    aPerson.LastNameKanji = dto.LastNameKanji
    aPerson.CellPhone = dto.CellNumber
    aPerson.DateOfBirth = dto.DateOfBirth
    aPerson.Gender = dto.Gender
    if(aPerson.PrimaryAddress == null){
      aPerson.PrimaryAddress = new Address()
    }
    _addressPlugin.updateFromDTO(aPerson.PrimaryAddress, dto.PrimaryAddress)
  }

  override function updateContact(aCompany: Company, dto: CompanyDTO) {
    updateBaseProperties(aCompany, dto)
    if(aCompany.PrimaryAddress == null){
      aCompany.PrimaryAddress = new Address()
    }
    _addressPlugin.updateFromDTO(aCompany.PrimaryAddress, dto.PrimaryAddress)
  }

  protected function fillContact(aContact : Contact, dto : ContactBaseDTO){
    fillBaseProperties(dto, aContact)

    if(aContact.PrimaryAddress != null){
      dto.PrimaryAddress = _addressPlugin.toDto(aContact.PrimaryAddress)
    }
  }

  public static function fillBaseProperties(dto : ContactBaseDTO, aContact : Contact) {
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
  }

  public static function updateBaseProperties(aContact: Contact, dto: ContactBaseDTO){
    aContact.Name = dto.ContactName
    aContact.NameKanji = dto.ContactNameKanji
    aContact.PrimaryPhone = dto.PrimaryPhoneType
    aContact.HomePhone = dto.HomeNumber
    aContact.WorkPhone = dto.WorkNumber
    aContact.EmailAddress1 = dto.EmailAddress1
  }
}
