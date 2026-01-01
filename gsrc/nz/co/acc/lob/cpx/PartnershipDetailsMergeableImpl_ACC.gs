package nz.co.acc.lob.cpx

uses entity.PolicyContactRole
uses gw.contact.PolicyContactRoleMergeableImpl

@Export
class PartnershipDetailsMergeableImpl_ACC extends PolicyContactRoleMergeableImpl {
  construct(mergeable : PartnershipDetails_ACC) {
    super(mergeable)
  }

  override function performMerge(merged : PolicyContactRole) {
    super.performMerge(merged)
  }
}