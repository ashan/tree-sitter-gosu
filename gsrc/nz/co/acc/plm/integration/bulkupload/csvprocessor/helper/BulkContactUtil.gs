package nz.co.acc.plm.integration.bulkupload.csvprocessor.helper

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.contact.ContactUtil
uses nz.co.acc.plm.integration.bulkupload.csvtypes.contact.CompanyContact
uses nz.co.acc.plm.integration.bulkupload.csvtypes.contact.IContactCommonFields
uses nz.co.acc.plm.integration.bulkupload.csvtypes.contact.PersonContact
uses entity.Address
uses typekey.Contact

/**
 * Converts data objects to Guidewire entities.
 * <p>
 * Created by OurednM on 19/06/2018.
 */
class BulkContactUtil {

  public static function toCompany(companyContact: CompanyContact, bundle: Bundle): Company {

    var company = new Company(bundle)

    company.ACCID_ACC = companyContact.ACCNumber

    company.Name = companyContact.Name

    company.PrimaryPhone = companyContact.PrimaryPhoneType

    company.HomePhoneCountry = companyContact.HomePhone.CountryCode
    company.HomePhone = companyContact.HomePhone.NationalNumber
    company.HomePhoneExtension = companyContact.HomePhone.Extension

    company.WorkPhoneCountry = companyContact.WorkPhone.CountryCode
    company.WorkPhone = companyContact.WorkPhone.NationalNumber
    company.WorkPhoneExtension = companyContact.WorkPhone.Extension

    company.CellPhoneCountry_ACC = companyContact.CellPhone.CountryCode
    company.CellPhone_ACC = companyContact.CellPhone.NationalNumber
    company.CellPhoneExtension_ACC = companyContact.CellPhone.Extension

    company.FaxPhoneCountry = companyContact.FaxPhone.CountryCode
    company.FaxPhone = companyContact.FaxPhone.NationalNumber
    company.FaxPhoneExtension = companyContact.FaxPhone.Extension

    company.EmailAddress1 = companyContact.PrimaryEmail
    company.EmailAddress2 = companyContact.SecondaryEmail

    var address = getAddress(companyContact, bundle)

    company.setPrimaryAddress(address)

    return company
  }

  public static function toPerson(personContact: PersonContact, bundle: Bundle): Person {

    var person = new Person(bundle)

    person.ACCID_ACC = personContact.ACCNumber

    person.Prefix = personContact.Title
    person.FirstName = personContact.FirstName
    person.MiddleName = personContact.MiddleName
    person.LastName = personContact.LastName
    person.Gender = personContact.Gender
    person.DateOfBirth = personContact.DateOfBirth

    person.PrimaryPhone = personContact.PrimaryPhoneType

    person.HomePhoneCountry = personContact.HomePhone.CountryCode
    person.HomePhone = personContact.HomePhone.NationalNumber
    person.HomePhoneExtension = personContact.HomePhone.Extension

    person.WorkPhoneCountry = personContact.WorkPhone.CountryCode
    person.WorkPhone = personContact.WorkPhone.NationalNumber
    person.WorkPhoneExtension = personContact.WorkPhone.Extension

    person.CellPhoneCountry = personContact.CellPhone.CountryCode
    person.CellPhone = personContact.CellPhone.NationalNumber
    person.CellPhoneExtension = personContact.CellPhone.Extension

    person.FaxPhoneCountry = personContact.FaxPhone.CountryCode
    person.FaxPhone = personContact.FaxPhone.NationalNumber
    person.FaxPhoneExtension = personContact.FaxPhone.Extension

    person.EmailAddress1 = personContact.PrimaryEmail
    person.EmailAddress2 = personContact.SecondaryEmail

    var address = getAddress(personContact, bundle)

    person.setPrimaryAddress(address)

    return person
  }

  public static function checkCompanyExists(accId: String, bundle: Bundle): boolean {
    var existing = findCompany(accId, null, bundle)
    return existing != null
  }

  public static function checkPersonExists(accId: String, bundle: Bundle): boolean {
    var existing = findPerson(accId, null, null, null, null, bundle)
    return existing != null
  }

  private static function getAddress(contact: IContactCommonFields, bundle: Bundle): Address {
    var address = new Address(bundle)
    address.Country = contact.Country
    address.Attention_ACC = contact.Attention
    address.AddressLine1 = contact.Address1
    address.AddressLine2 = contact.Address2
    address.AddressLine3 = contact.Address3
    address.City = contact.City
    address.PostalCode = contact.PostalCode
    address.ValidUntil = contact.ValidUntil
    address.AddressType = contact.AddressType
    address.AddressLocType_ACC = contact.AddressLocationType
    return address
  }


  public static function findCompany(accID: String, name: String, bundle: Bundle): Company {

    if (accID != null) {
      var contact = ContactUtil.getContact(accID, Contact.TC_COMPANY, bundle)
      return contact typeis Company ? contact : null

    } else if (name != null) {
      var contact = ContactUtil.getCompanyContact(name)
      return contact typeis Company ? contact : null

    } else {
      return null
    }
  }

  public static function findPerson(
      accID: String,
      firstName: String,
      lastName: String,
      middleName: String,
      dob: Date,
      bundle: Bundle): Person {

    if (accID != null) {
      var contact = ContactUtil.getContact(accID, Contact.TC_PERSON, bundle)
      return contact typeis Person ? contact : null

    } else {
      var query = Query.make(Person)
          .compare("FirstName", Relop.Equals, firstName)
          .compare("LastName", Relop.Equals, lastName)

      if (middleName != null) {
        query = query.compare("MiddleName", Relop.Equals, middleName)
      }

      if (dob != null) {
        query = query.compare("DateOfBirth", Relop.Equals, dob)
      }

      var contact = query.select().AtMostOneRow
      if (contact != null) {
        contact = bundle.add(contact)
      }

      return contact
    }

  }


}