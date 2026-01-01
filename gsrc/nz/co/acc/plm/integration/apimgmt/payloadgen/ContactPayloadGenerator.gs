package nz.co.acc.plm.integration.apimgmt.payloadgen

uses entity.Contact
uses nz.co.acc.common.GenericConstants
uses nz.co.acc.common.integration.apimgmt.json.JSONAccreditation
uses nz.co.acc.common.integration.apimgmt.json.JSONContact
uses nz.co.acc.common.integration.apimgmt.json.JSONPhoneNumber
uses nz.co.acc.common.integration.apimgmt.payloadgen.AbstractPayloadGenerator
uses nz.co.acc.common.integration.apimgmt.payloadgen.GenFlags
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

uses java.text.SimpleDateFormat

/**
 * Payload generator for the Contact entity. Covers its subtypes as well.
 */
class ContactPayloadGenerator extends AbstractPayloadGenerator<JSONContact, Contact> {

  construct() {
    super()
  }

  construct(contact: Contact) {
    super(contact);
  }

  override function generate(flags: GenFlags[]): JSONContact {
    if (entity == null) {
      return null
    }

    var pContact = new JSONContact()

    pContact.LinkID = entity.getLinkID()
    pContact.Type = entity.Subtype.Code
    pContact.ACCID = entity.ACCID_ACC
    pContact.Name = entity.Name?:entity.DisplayName

    if (not flags.contains(GenFlags.ROOT_ONLY)) {
      pContact.PrimaryAddress = new AddressPayloadGenerator(entity.PrimaryAddress).generate(flags)
    }

    pContact.HomePhone = new JSONPhoneNumber(
        entity.HomePhoneCountry.Code,
        entity.HomePhone,
        entity.HomePhoneExtension,
        entity.HomePhoneValue)

    pContact.WorkPhone = new JSONPhoneNumber(
        entity.WorkPhoneCountry.Code,
        entity.WorkPhone,
        entity.WorkPhoneExtension,
        entity.WorkPhoneValue)

    pContact.PrimaryPhone = entity.PrimaryPhone.Code
    pContact.PrimaryEmail = entity.EmailAddress1
    pContact.SecondaryEmail = entity.EmailAddress2

    if (entity typeis Person) {
      entity = entity as Person
      pContact.Title = entity.Prefix.Code
      pContact.FirstName = entity.FirstName
      pContact.MiddleName = entity.MiddleName
      pContact.LastName = entity.LastName
      pContact.Gender = entity.Gender.Code
      if (entity.DateOfBirth != null) {
        pContact.DateOfBirth = new SimpleDateFormat(ConstantPropertyHelper.DATE_FORMAT_yyyyMMdd).format(entity.DateOfBirth)
      }

      pContact.MobilePhone = new JSONPhoneNumber(
          entity.CellPhoneCountry.Code,
          entity.CellPhone,
          entity.CellPhoneExtension,
          entity.CellPhoneValue)

      if (not flags.contains(GenFlags.ROOT_ONLY)) {
        var accreditations = entity.Accreditations_ACC
        var pAccreditations = new ArrayList<JSONAccreditation>()
        var apg = new AccreditationPayloadGenerator()
        accreditations.each(\accr -> pAccreditations.add(apg.generate(accr, flags)))
        pContact.Accreditations = pAccreditations.toTypedArray()
      }

    } else if (entity typeis Company) {
      entity = entity as Company
      pContact.MobilePhone = new JSONPhoneNumber(
          entity.CellPhoneCountry_ACC.Code,
          entity.CellPhone_ACC,
          entity.CellPhoneExtension_ACC,
          entity.CellPhoneValue)
    }

    pContact.UpdateTime = new SimpleDateFormat(GenericConstants.ISO8601_TIMESTAMP_PATTERN).format(entity.UpdateTime)
    return pContact
  }

  /**
   * Generator for the  UserContact subtype.
   *
   * @return json pojo
   */
  function generateUserContact(flags: GenFlags[]): JSONContact {
    if (entity == null) {
      return null
    }
    if (not(entity typeis UserContact)) {
      throw new IllegalStateException("Expected a UserContact but found ${typeof entity}")
    }

    var pUserContact = new JSONContact()

    var userContact = entity as UserContact

    pUserContact.LinkID = userContact.getLinkID()
    pUserContact.Name = userContact.DisplayName
    pUserContact.FirstName = userContact.FirstName
    pUserContact.MiddleName = userContact.MiddleName
    pUserContact.LastName = userContact.LastName
    pUserContact.PrimaryEmail = userContact.EmailAddress1
    pUserContact.PrimaryPhone = userContact.PrimaryPhone.Code

    pUserContact.HomePhone = new JSONPhoneNumber(
        userContact.HomePhoneCountry.Code,
        userContact.HomePhone,
        userContact.HomePhoneExtension,
        userContact.HomePhoneValue)

    pUserContact.WorkPhone = new JSONPhoneNumber(
        userContact.WorkPhoneCountry.Code,
        userContact.WorkPhone,
        userContact.WorkPhoneExtension,
        userContact.WorkPhoneValue)

    pUserContact.MobilePhone = new JSONPhoneNumber(
        userContact.CellPhoneCountry.Code,
        userContact.CellPhone,
        userContact.CellPhoneExtension,
        userContact.CellPhoneValue)

    if (not flags.contains(GenFlags.ROOT_ONLY)) {
      pUserContact.PrimaryAddress = new AddressPayloadGenerator(userContact.PrimaryAddress).generate({})
    }
    pUserContact.UpdateTime = new SimpleDateFormat(GenericConstants.ISO8601_TIMESTAMP_PATTERN).format(userContact.UpdateTime)

    return pUserContact
  }

}