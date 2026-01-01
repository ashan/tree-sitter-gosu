package nz.co.acc.plm.integration.apimgmt.payloadgen

uses nz.co.acc.common.GenericConstants
uses nz.co.acc.common.integration.apimgmt.json.JSONUser
uses nz.co.acc.common.integration.apimgmt.payloadgen.AbstractPayloadGenerator
uses nz.co.acc.common.integration.apimgmt.payloadgen.GenFlags

uses java.text.SimpleDateFormat

/**
 * Payload generator for the User entity.
 */
class UserPayloadGenerator extends AbstractPayloadGenerator<JSONUser, User> {

  construct(user: User) {
    super(user)
  }

  override function generate(flags: GenFlags[]): JSONUser {
    if (entity == null) {
      return null
    }

    var pUser = new JSONUser()

    pUser.LinkID = entity.getLinkID()
    pUser.PrimaryEmail = entity.Contact.EmailAddress1
    pUser.UpdateTime = new SimpleDateFormat(GenericConstants.ISO8601_TIMESTAMP_PATTERN).format(entity.UpdateTime)
    return pUser
  }

}