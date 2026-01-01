package nz.co.acc.integration.junoinformationservice.payloadgenerator.account

uses entity.Contact
uses gw.api.util.PhoneUtil
uses nz.co.acc.integration.junoinformationservice.model.account.GSONContact
uses nz.co.acc.integration.junoinformationservice.model.account.GSONPhoneNumber

/**
 * Payload generator for the Contact entity. Covers its subtypes as well.
 */
class ContactGsonGenerator {

  function generate(entity : Contact) : GSONContact {
    if (entity == null) {
      return null
    }

    var gsonDoc = new GSONContact()

    gsonDoc.publicId = entity.PublicID
    gsonDoc.contactType = entity.Subtype.Code
    gsonDoc.accId = entity.ACCID_ACC
    gsonDoc.name = entity.Name?:entity.DisplayName

    gsonDoc.homePhone = new GSONPhoneNumber(
        entity.HomePhoneCountry.Code,
        getCountryCode(entity.HomePhoneCountry),
        entity.HomePhone,
        entity.HomePhoneExtension)

    gsonDoc.workPhone = new GSONPhoneNumber(
        entity.WorkPhoneCountry.Code,
        getCountryCode(entity.WorkPhoneCountry),
        entity.WorkPhone,
        entity.WorkPhoneExtension)

    gsonDoc.irCellPhone = entity.IRCellPhone_ACC
    gsonDoc.irCellPhoneVerified = entity.IRPhoneVerifiedStatus_ACC
    gsonDoc.irEmail = entity.IREmailAddress
    gsonDoc.irEmailVerified = entity.IREmailVerifiedStatus_ACC
    gsonDoc.primaryPhone = entity.PrimaryPhone.Code
    gsonDoc.primaryEmail = entity.EmailAddress1
    gsonDoc.secondaryEmail = entity.EmailAddress2
    gsonDoc.emailVerifiedDate = entity.EmailVerifiedDate_ACC?.toISOTimestamp()
    gsonDoc.correspondencePreference = entity.CorrespondencePreference_ACC.Code
    gsonDoc.claimsEmail = entity.ClaimsEmailAddress_ACC
    gsonDoc.claimsEmailVerifiedDate = entity.ClaimsEmailVerifiedDate_ACC?.toISOTimestamp()
    if (entity typeis Person) {
      entity = entity as Person
      gsonDoc.title = entity.Prefix.DisplayName
      gsonDoc.firstName = entity.FirstName
      gsonDoc.middleName = entity.MiddleName
      gsonDoc.lastName = entity.LastName
      gsonDoc.gender = entity.Gender.DisplayName
      gsonDoc.dateOfBirth = entity.DateOfBirth?.toISODate()

      gsonDoc.mobilePhone = new GSONPhoneNumber(
          entity.CellPhoneCountry.Code,
          getCountryCode(entity.CellPhoneCountry),
          entity.CellPhone,
          entity.CellPhoneExtension)

      var accreditations = entity.Accreditations_ACC
      var apg = new AccreditationGsonGenerator()
      gsonDoc.accreditations = accreditations.fastList().map(\accr -> apg.generate(accr))

    } else if (entity typeis Company) {
      entity = entity as Company
      gsonDoc.mobilePhone = new GSONPhoneNumber(
          entity.CellPhoneCountry_ACC.Code,
          getCountryCode(entity.CellPhoneCountry_ACC),
          entity.CellPhone_ACC,
          entity.CellPhoneExtension_ACC)
    }

    gsonDoc.addresses = entity.AllAddresses.toList().map(\address -> {
      var gsonAddress = new AddressGsonGenerator().generate(address)
      gsonAddress.isPrimary = gsonAddress.publicId == entity.PrimaryAddress.PublicID
      return gsonAddress
    })

    gsonDoc.updateTime = entity.UpdateTime.toISOTimestamp()

    return gsonDoc
  }

  private function getCountryCode(countryCode : PhoneCountryCode) : String {
    if (countryCode == null) {
      return null
    }

    var countryCodeForRegion = PhoneUtil.getCountryCodeForRegion(countryCode)
    if (countryCodeForRegion != 0) {
      return "+${countryCodeForRegion}"
    } else {
      return null
    }
  }

}