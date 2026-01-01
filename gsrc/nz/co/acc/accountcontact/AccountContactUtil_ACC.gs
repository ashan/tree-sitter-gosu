package nz.co.acc.accountcontact

uses gw.api.builder.AccountContactBuilder
uses gw.api.database.MultipleMatchesException
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.account.AccountUtil
uses nz.co.acc.accountcontact.error.*
uses nz.co.acc.accountcontact.relationship.CompanyContactRelationship
uses nz.co.acc.accountcontact.relationship.PersonContactRelationship
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.helper.BulkContactUtil
uses typekey.AccountContactRole
uses entity.AccountContact
uses entity.Contact

/**
 * Provides functions to add/remove existing contacts to an account.
 * Created by Mike Ourednik on 11/03/2019.
 */
class AccountContactUtil_ACC {

  private static var _logger = StructuredLogger.CONFIG.withClass(AccountContactUtil_ACC)

  public static function createPersonContactRelationship(contactRelationship : PersonContactRelationship) {
    processPersonContactRelationship(contactRelationship, false)
  }

  public static function deletePersonContactRelationship(contactRelationship : PersonContactRelationship) {
    processPersonContactRelationship(contactRelationship, true)
  }

  public static function createCompanyContactRelationship(contactRelationship : CompanyContactRelationship) {
    processCompanyContactRelationship(contactRelationship, false)
  }

  public static function deleteCompanyContactRelationship(contactRelationship : CompanyContactRelationship) {
    processCompanyContactRelationship(contactRelationship, true)
  }

  private static function createAccountRoleForCompany(
      account : Account, company : Company, relationship : CompanyContactRelationship, bundle : Bundle) {
    final var fn = "createAccountRoleForCompany"
    // Create role
    var accountContact = getOrCreateAccountContact(account, company, bundle)
    accountContact.addNewRole(relationship.AccountRole)
    logInfo(fn, "Linked company contact ${company.ACCID_ACC} to account ${account.ACCID_ACC} with role ${relationship.AccountRole}")
  }

  private static function createAccountRoleForPerson(
      account : Account, person : Person, relationship : PersonContactRelationship, bundle : Bundle) {
    final var fn = "createAccountRoleForPerson"
    // Create role
    var accountContact = getOrCreateAccountContact(account, person, bundle)
    accountContact.addNewRole(relationship.AccountRole)

    if (relationship.AccountRole == AccountContactRole.TC_AUTHORISED3RDPARTY_ACC) {
      if (relationship.ThirdPartyRelation == null) {
        throw new ContactRelationshipUndefinedException("ThirdPartyRelation must be provided for ${AccountContactRole.TC_AUTHORISED3RDPARTY_ACC}")
      }
      var role = accountContact.getRole(relationship.AccountRole) as Authorised3rdParty_ACC
      role.setPartyRelation(relationship.ThirdPartyRelation)

    } else if (relationship.AccountRole == AccountContactRole.TC_AUTHORISEDCOMPANYEMPLOYEE_ACC) {
      if (relationship.EmployeeRelation == null) {
        throw new ContactRelationshipUndefinedException("EmployeeRelation must be provided for ${AccountContactRole.TC_AUTHORISEDCOMPANYEMPLOYEE_ACC}")
      }
      var role = accountContact.getRole(relationship.AccountRole) as AuthorisedCompanyEmployee_ACC
      role.setEmployeeRelation(relationship.EmployeeRelation)
    }
    logInfo(fn, "Linked person contact ${person.ACCID_ACC} to account ${account.ACCID_ACC} with role ${relationship.AccountRole}")
  }

  private static function deleteRelationship(
      contact : Contact,
      account : Account,
      accountRole : AccountContactRole,
      thirdPartyRelation : Auth3rdPartyRelations_ACC,
      employeeRelation : AuthCompEmpRelation_ACC) {

    final var fn = "deleteRelationship"
    // Delete role
    var accountContact = getAccountContact(account, contact)
    if (accountContact == null) {
      logInfo(fn, "Contact ${contact.ACCID_ACC} is not an account contact for account ${account.ACCID_ACC}")

    } else {
      if (accountRole == null) {
        deleteAllRoles(account, contact, accountContact)
      } else {
        deleteRole(account, contact, accountContact, accountRole, thirdPartyRelation, employeeRelation)
      }
    }
  }

  private static function deleteRole(
      account : Account,
      contact : Contact,
      accountContact : AccountContact,
      accountRole : AccountContactRole,
      thirdPartyRelation : Auth3rdPartyRelations_ACC,
      employeeRelation : AuthCompEmpRelation_ACC) {

    final var fn = "deleteRole"

    var roles = accountContact.Roles
    var role = roles?.firstWhere(\role -> role.getSubtype() == accountRole)

    if (role != null) {

      if (role typeis Authorised3rdParty_ACC) {
        if (role.PartyRelation != thirdPartyRelation) {
          throw new ContactRelationshipException("Specified ThirdPartyRelation '${thirdPartyRelation}' does not match existing value '${role.PartyRelation}'")
        }
      }

      if (role typeis AuthorisedCompanyEmployee_ACC) {
        if (role.EmployeeRelation != employeeRelation) {
          throw new ContactRelationshipException("Specified EmployeeRelation '${employeeRelation}' does not match existing value '${role.EmployeeRelation}'")
        }
      }

      accountContact.removeFromRoles(role)
      logInfo(fn, "Removed role ${accountRole} from contact ${contact.ACCID_ACC} / account ${account.ACCID_ACC}")
      if (roles.Count == 1) {
        account.removeFromAccountContacts(accountContact)
        logInfo(fn, "Removed accountContact ${accountContact} from account ${account.ACCID_ACC}")
      }
    }
  }

  private static function deleteAllRoles(account : Account, contact : Contact, accountContact : AccountContact) {
    final var fn = "deleteAllRoles"

    var roles = accountContact.Roles
    if (roles.hasMatch(\role -> role.Subtype == AccountContactRole.TC_ACCOUNTHOLDER)) {
      throw new ContactRelationshipException("Not permitted to remove Account Holder.")
    }

    for (role in roles) {
      accountContact.removeFromRoles(role)
      logInfo(fn, "Removed role ${role} from contact ${contact.ACCID_ACC} / account ${account.ACCID_ACC}")
    }
    account.removeFromAccountContacts(accountContact)
    logInfo(fn, "Removed accountContact ${accountContact} from account ${account.ACCID_ACC}")
  }

  private static function processCompanyContactRelationship(contactRelationship : CompanyContactRelationship, isDeletion : Boolean) {
    final var fn = "processCompanyContactRelationship"

    var account = AccountUtil.getAccount(contactRelationship.AccountACCNumber)
    if (account == null) {
      throw new ContactRelationshipException("Account not found with ACCNumber: ${contactRelationship.AccountACCNumber}")
    }

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {

      account = bundle.add(account)

      var company : Company
      try {
        company = BulkContactUtil.findCompany(contactRelationship.ContactACCNumber, contactRelationship.ContactName, bundle)
      } catch (e : gw.api.database.MultipleMatchesException) {
        throw new ContactMultipleMatchesException("Found multiple matches for contact name.")
      }

      if (company == null) {
        if (contactRelationship.ContactACCNumber != null) {
          throw new ContactNotFoundException("Can not find Company contact with ACCNumber: ${contactRelationship.ContactACCNumber}")
        } else {
          throw new ContactNotFoundException("Can not find Company contact with name: ${contactRelationship.ContactName}")
        }
      }

      if (contactRelationship.AccountRole == AccountContactRole.TC_ACCOUNTHOLDER) {
        throw new ContactRelationshipException("Not permitted to change Account Holder with this bulk uploader.")
      }

      if (isDeletion) {
        deleteRelationship(company, account, contactRelationship.AccountRole, null, null)
      } else {
        createAccountRoleForCompany(account, company, contactRelationship, bundle)
      }

    }, "sys")
  }

  private static function getAccountContact(account : Account, contact : Contact) : AccountContact {
    return account.AccountContacts
        .firstWhere(\accountContact -> accountContact.Contact.ACCID_ACC == contact.ACCID_ACC)
  }

  private static function getOrCreateAccountContact(account : Account, contact : Contact, bundle : Bundle) : AccountContact {
    var accountContact = getAccountContact(account, contact)

    if (accountContact == null) {
      return new AccountContactBuilder()
          .withContact(contact)
          .onAccount(account)
          .create(bundle)

    } else {
      return accountContact
    }
  }

  private static function processPersonContactRelationship(contactRelationship : PersonContactRelationship, isDeletion : Boolean) {

    final var fn = "processPersonContactRelationship"

    var account = AccountUtil.getAccount(contactRelationship.AccountACCNumber)
    if (account == null) {
      throw new ContactRelationshipException("Account not found with ACCNumber: ${contactRelationship.AccountACCNumber}")
    }

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {

      account = bundle.add(account)

      var person : Person
      try {
        person = BulkContactUtil.findPerson(
            contactRelationship.ContactACCNumber,
            contactRelationship.ContactFirstName,
            contactRelationship.ContactLastName,
            contactRelationship.ContactMiddleName,
            contactRelationship.ContactDateOfBirth,
            bundle)
      } catch (e : MultipleMatchesException) {
        throw new ContactMultipleMatchesException("Found multiple matches for contact name.")
      }

      if (person == null) {
        if (contactRelationship.ContactACCNumber != null) {
          throw new ContactNotFoundException("Can not find Person contact with ACCNumber: ${contactRelationship.ContactACCNumber}")
        } else {
          throw new ContactNotFoundException("Can not find ${contactRelationship.getNameAndDOB()}")
        }
      }

      if (contactRelationship.AccountRole == AccountContactRole.TC_ACCOUNTHOLDER) {
        throw new ContactRelationshipException("Not permitted to add/change Account Holder with this bulk uploader.")
      }

      if (isDeletion) {
        deleteRelationship(person, account, contactRelationship.AccountRole,
            contactRelationship.ThirdPartyRelation, contactRelationship.EmployeeRelation)
      } else {
        createAccountRoleForPerson(account, person, contactRelationship, bundle)
      }
    }, "sys")
  }

  private static function logInfo(fn : String, msg : String) {
    _logger.info(msg)
  }

  private static function logError(fn : String, msg : String, e : Exception) {
    _logger.error_ACC(msg, e)
  }
}