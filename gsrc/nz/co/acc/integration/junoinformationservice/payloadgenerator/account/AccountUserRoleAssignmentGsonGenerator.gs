package nz.co.acc.integration.junoinformationservice.payloadgenerator.account

uses gw.api.util.PhoneUtil
uses nz.co.acc.integration.junoinformationservice.model.account.GSONAccountUserRoleAssignment
uses nz.co.acc.integration.junoinformationservice.model.account.GSONPhoneNumber

/**
 * Payload generator for the AccountUserRoleAssignment entity.
 */
class AccountUserRoleAssignmentGsonGenerator {

  function generate(entity: AccountUserRoleAssignment) : GSONAccountUserRoleAssignment {
    if (entity == null) {
      return null
    }

    var contact = entity.AssignedUser.Contact

    var gsonDoc = new GSONAccountUserRoleAssignment()
    gsonDoc.roleName = entity.Role.Code
    gsonDoc.userName = entity.AssignedUser.DisplayName
    gsonDoc.groupName = entity.AssignedGroup.DisplayName
    gsonDoc.email = contact.EmailAddress1

    gsonDoc.mobilePhone = new GSONPhoneNumber(
        contact.CellPhoneCountry.Code,
        getCountryCode(contact.CellPhoneCountry),
        contact.CellPhone,
        null)

    gsonDoc.workPhone = new GSONPhoneNumber(
        contact.WorkPhoneCountry.Code,
        getCountryCode(contact.WorkPhoneCountry),
        contact.WorkPhone,
        contact.WorkPhoneExtension)

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