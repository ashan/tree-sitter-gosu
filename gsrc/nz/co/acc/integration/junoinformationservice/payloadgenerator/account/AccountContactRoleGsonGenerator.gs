package nz.co.acc.integration.junoinformationservice.payloadgenerator.account

uses entity.AccountContactRole
uses nz.co.acc.integration.junoinformationservice.model.account.GSONAccountContactRole

/**
 * Payload generator for the AccountContactRole entity.
 */
class AccountContactRoleGsonGenerator {

  function generate(entity : AccountContactRole) : GSONAccountContactRole {
    if (entity == null) {
      return null
    }

    var gsonDoc = new GSONAccountContactRole()

    gsonDoc.roleName = entity.Subtype.Code

    switch (entity.Subtype) {
      case typekey.AccountContactRole.TC_AUTHORISED3RDPARTY_ACC:
        gsonDoc.relationToAccount = (entity as Authorised3rdParty_ACC).PartyRelation.Code
        break
      case typekey.AccountContactRole.TC_AUTHORISEDCOMPANYEMPLOYEE_ACC:
        gsonDoc.relationToAccount = (entity as AuthorisedCompanyEmployee_ACC).EmployeeRelation.Code
        gsonDoc.comments = (entity as AuthorisedCompanyEmployee_ACC).Other
        break
    }

    return gsonDoc
  }
}