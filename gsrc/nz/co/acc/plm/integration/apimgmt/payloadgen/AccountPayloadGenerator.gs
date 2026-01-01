package nz.co.acc.plm.integration.apimgmt.payloadgen

uses nz.co.acc.common.GenericConstants
uses nz.co.acc.common.integration.apimgmt.json.JSONAccount
uses nz.co.acc.common.integration.apimgmt.json.JSONAccountContact
uses nz.co.acc.common.integration.apimgmt.json.JSONAccountUserRoleAssignment
uses nz.co.acc.common.integration.apimgmt.payloadgen.AbstractPayloadGenerator
uses nz.co.acc.common.integration.apimgmt.payloadgen.GenFlags

uses java.text.SimpleDateFormat

/**
 * Payload generator for the Account entity.
 */
class AccountPayloadGenerator extends AbstractPayloadGenerator<JSONAccount, Account> {
  construct(account : Account) {
    super(account);
  }

  override function generate(flags : GenFlags[]) : JSONAccount {
    if (entity == null) {
      return null
    }

    var pAccount = new JSONAccount()

    pAccount.LinkID = entity.getLinkID()
    pAccount.ACCID = entity.ACCID_ACC
    pAccount.IRNumber = entity.IRDNumber_ACC
    pAccount.NZBN = entity.NZBN_ACC
    pAccount.TradingName = entity.TradingName_ACC
    pAccount.IsRestricted = entity.RestrictedAccount_ACC

    pAccount.IsAEPContractAccount = entity.AEPContractAccount_ACC
    pAccount.AEPContractNumber = entity.AEPContractNumber_ACC

    if(ScriptParameters.ForceInactiveCeasetoActive_ACC and
       (entity.StatusOfAccount_ACC == StatusOfAccount_ACC.TC_CEASED or
        entity.StatusOfAccount_ACC == StatusOfAccount_ACC.TC_INACTIVE)) {
      pAccount.AccountStatus = StatusOfAccount_ACC.TC_ACTIVE.Code
    } else {
      pAccount.AccountStatus = entity.StatusOfAccount_ACC.Code
    }

    pAccount.OrganisationType = entity.AccountOrgType.Code

    if (!flags.contains(GenFlags.ROOT_ONLY)) {
      pAccount.UserRoleAssignments = generateAccountUserRoleAssignments()

      var pAccountContacts = new ArrayList<JSONAccountContact>()
      var acpg = new AccountContactPayloadGenerator()
      entity.AccountContacts.each(\elt -> pAccountContacts.add(acpg.generate(elt, flags)))
      pAccount.AccountContacts = pAccountContacts.toTypedArray()
    }
    pAccount.UpdateTime = new SimpleDateFormat(GenericConstants.ISO8601_TIMESTAMP_PATTERN).format(entity.UpdateTime)
    return pAccount
  }

  /**
   * Payload generator for the user role assignments of the underlying Account.
   *
   * @return array of JSON payload pojos
   */
  private function generateAccountUserRoleAssignments() : JSONAccountUserRoleAssignment[] {
    if (entity == null) {
      return null
    }

    var pUserRoleAssignments = new ArrayList<JSONAccountUserRoleAssignment>()
    var aurapg = new AccountUserRoleAssignmentPayloadGenerator()
    entity.RoleAssignments.each(\elt -> pUserRoleAssignments.add(aurapg.generate(elt, {})))
    return pUserRoleAssignments.toTypedArray()
  }
}
