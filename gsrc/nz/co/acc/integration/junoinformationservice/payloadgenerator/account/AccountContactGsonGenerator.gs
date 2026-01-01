package nz.co.acc.integration.junoinformationservice.payloadgenerator.account

uses entity.AccountContact
uses nz.co.acc.integration.junoinformationservice.model.account.GSONAccountContact

/**
 * Payload generator for the AccountContact entity.
 */
class AccountContactGsonGenerator {

  function generate(accountContact : AccountContact) : GSONAccountContact {

    var gsonDoc = new GSONAccountContact()

    gsonDoc.active = accountContact.Active
    gsonDoc.primary = accountContact.Primary_ACC
    gsonDoc.contact = new ContactGsonGenerator().generate(accountContact.Contact)

    var acrpg = new AccountContactRoleGsonGenerator()
    gsonDoc.accountContactRoles = accountContact.Roles.fastList().map(\role -> acrpg.generate(role))

    return gsonDoc
  }
}