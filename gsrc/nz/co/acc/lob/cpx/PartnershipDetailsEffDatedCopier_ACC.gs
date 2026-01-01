package nz.co.acc.lob.cpx

uses gw.contact.AbstractPolicyContactRoleCopier

@Export
class PartnershipDetailsEffDatedCopier_ACC extends AbstractPolicyContactRoleCopier<PartnershipDetails_ACC> {

  construct(shareholder : PartnershipDetails_ACC) {
    super(shareholder)
  }
  
  
  override protected function copyRoleSpecificFields(shareholder : PartnershipDetails_ACC) {
  }

}
 