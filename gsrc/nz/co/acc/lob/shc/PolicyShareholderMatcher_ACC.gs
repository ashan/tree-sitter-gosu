package nz.co.acc.lob.shc

uses gw.contact.AbstractPolicyContactRoleMatcher

/**
 * Matches {@link PolicyShareholder_ACC}s based on the properties defined in {@link AbstractPolicyContactRoleMatcher}.
 */
@Export
class PolicyShareholderMatcher_ACC extends AbstractPolicyContactRoleMatcher<PolicyShareholder_ACC> {

  construct(shareholder : PolicyShareholder_ACC) {
    super(shareholder)
  }

}
