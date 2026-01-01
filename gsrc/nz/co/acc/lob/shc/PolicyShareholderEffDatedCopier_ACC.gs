package nz.co.acc.lob.shc

uses gw.account.PersonToPolicyContactRoleSyncedField
uses gw.contact.AbstractPolicyContactRoleCopier

@Export
class PolicyShareholderEffDatedCopier_ACC extends AbstractPolicyContactRoleCopier<PolicyShareholder_ACC> {

  construct(shareholder : PolicyShareholder_ACC) {
    super(shareholder)
  }
  
  
  override protected function copyRoleSpecificFields(shareholder : PolicyShareholder_ACC) {
  }

}
 