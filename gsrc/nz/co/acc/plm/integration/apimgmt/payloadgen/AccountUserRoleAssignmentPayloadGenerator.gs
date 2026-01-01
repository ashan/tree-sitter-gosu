package nz.co.acc.plm.integration.apimgmt.payloadgen

uses nz.co.acc.common.GenericConstants
uses nz.co.acc.common.integration.apimgmt.json.JSONAccountUserRoleAssignment
uses nz.co.acc.common.integration.apimgmt.payloadgen.AbstractPayloadGenerator
uses nz.co.acc.common.integration.apimgmt.payloadgen.GenFlags

uses java.text.SimpleDateFormat

/**
 * Payload generator for the AccountUserRoleAssignment entity.
 */
class AccountUserRoleAssignmentPayloadGenerator extends AbstractPayloadGenerator<JSONAccountUserRoleAssignment, AccountUserRoleAssignment> {

  construct() {
    super()
  }

  construct(assignment: AccountUserRoleAssignment) {
    super(assignment)
  }

  override function generate(flags: GenFlags[]): JSONAccountUserRoleAssignment {
    if (entity == null) {
      return null
    }

    var pAssignment = new JSONAccountUserRoleAssignment()

    pAssignment.LinkID = entity.getLinkID()
    pAssignment.RoleName = entity.Role.Code
    pAssignment.User = new UserPayloadGenerator(entity.AssignedUser).generate({})
    pAssignment.UpdateTime = new SimpleDateFormat(GenericConstants.ISO8601_TIMESTAMP_PATTERN).format(entity.UpdateTime)

    return pAssignment
  }
}