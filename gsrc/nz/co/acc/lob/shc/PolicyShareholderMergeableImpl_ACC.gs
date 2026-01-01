package nz.co.acc.lob.shc

uses gw.contact.PolicyContactRoleMergeableImpl
uses entity.PolicyContactRole

@Export
class PolicyShareholderMergeableImpl_ACC extends PolicyContactRoleMergeableImpl {
  construct(mergeable : PolicyShareholder_ACC) {
    super(mergeable)
  }

  override function performMerge(merged : PolicyContactRole) {
    super.performMerge(merged)
  }
}