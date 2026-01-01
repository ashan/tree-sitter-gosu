package nz.co.acc.lob.cpx

uses gw.contact.AbstractPolicyContactRoleMatcher

/**
 * Matches {@link PartnershipDetails_ACC}s based on the properties defined in {@link AbstractPolicyContactRoleMatcher}.
 */
@Export
class PartnershipDetailsMatcher_ACC extends AbstractPolicyContactRoleMatcher<PartnershipDetails_ACC> {

  construct(shareholder : PartnershipDetails_ACC) {
    super(shareholder)
  }

}
