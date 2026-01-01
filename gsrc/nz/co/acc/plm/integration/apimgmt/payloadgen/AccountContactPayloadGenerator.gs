package nz.co.acc.plm.integration.apimgmt.payloadgen

uses entity.AccountContact
uses nz.co.acc.common.GenericConstants
uses nz.co.acc.common.integration.apimgmt.json.JSONAccountContact
uses nz.co.acc.common.integration.apimgmt.json.JSONAccountContactRole
uses nz.co.acc.common.integration.apimgmt.payloadgen.AbstractPayloadGenerator
uses nz.co.acc.common.integration.apimgmt.payloadgen.GenFlags

uses java.text.SimpleDateFormat

/**
 * Payload generator for the AccountContact entity.
 */
class AccountContactPayloadGenerator extends AbstractPayloadGenerator<JSONAccountContact, AccountContact> {

  construct() {
    super()
  }

  construct(accountContact: AccountContact) {
    super(accountContact)
  }

  override function generate(flags: GenFlags[]): JSONAccountContact {
    if (entity == null) {
      return null
    }

    var pAccountContact = new JSONAccountContact()
    pAccountContact.LinkID = entity.getLinkID()

    pAccountContact.Active = entity.Active
    pAccountContact.Primary = entity.Primary_ACC

    if (not flags.contains(GenFlags.ROOT_ONLY)) {
      pAccountContact.Contact = new ContactPayloadGenerator(entity.Contact).generate(flags)

      var pRoles = new ArrayList<JSONAccountContactRole>()
      var acrpg = new AccountContactRolePayloadGenerator()
      entity.Roles.each(\role -> pRoles.add(acrpg.generate(role, flags)))
      pAccountContact.AccountContactRoles = pRoles.toTypedArray()
    }
    pAccountContact.UpdateTime = new SimpleDateFormat(GenericConstants.ISO8601_TIMESTAMP_PATTERN).format(entity.UpdateTime)
    return pAccountContact
  }
}