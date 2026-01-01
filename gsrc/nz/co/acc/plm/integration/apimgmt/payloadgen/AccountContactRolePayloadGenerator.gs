package nz.co.acc.plm.integration.apimgmt.payloadgen

uses entity.AccountContactRole
uses nz.co.acc.common.GenericConstants
uses nz.co.acc.common.integration.apimgmt.json.JSONAccountContactRole
uses nz.co.acc.common.integration.apimgmt.payloadgen.AbstractPayloadGenerator
uses nz.co.acc.common.integration.apimgmt.payloadgen.GenFlags

uses java.text.SimpleDateFormat

/**
 * Payload generator for the AccountContactRole entity.
 */
class AccountContactRolePayloadGenerator extends AbstractPayloadGenerator<JSONAccountContactRole, AccountContactRole> {
  
  construct() {
    super()
  }

  construct(accountContactRole: AccountContactRole) {
    super(accountContactRole)
  }

  override function generate(flags: GenFlags[]): JSONAccountContactRole {
    if (entity == null) {
      return null
    }

    var pAccountContactRole = new JSONAccountContactRole()

    pAccountContactRole.LinkID = entity.getLinkID()
    pAccountContactRole.RoleName = entity.Subtype.Code

    switch (entity.Subtype) {
      case typekey.AccountContactRole.TC_AUTHORISED3RDPARTY_ACC:
        pAccountContactRole.RelationToAccount = (entity as Authorised3rdParty_ACC).PartyRelation.Code
        break
      case typekey.AccountContactRole.TC_AUTHORISEDCOMPANYEMPLOYEE_ACC:
        pAccountContactRole.RelationToAccount = (entity as AuthorisedCompanyEmployee_ACC).EmployeeRelation.Code
        pAccountContactRole.Comments = (entity as AuthorisedCompanyEmployee_ACC).Other
        break
    }

    pAccountContactRole.UpdateTime = new SimpleDateFormat(GenericConstants.ISO8601_TIMESTAMP_PATTERN).format(entity.UpdateTime)

    return pAccountContactRole
  }
}