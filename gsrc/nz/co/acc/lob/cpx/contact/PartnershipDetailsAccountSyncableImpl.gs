package nz.co.acc.lob.cpx.contact

uses com.google.common.collect.ImmutableSet
uses gw.api.domain.account.AccountSyncable
uses gw.api.domain.account.AccountSyncedField
uses gw.contact.AbstractPolicyContactRoleAccountSyncableImpl

/**
 * Implementation that handles PartnershipDetails_ACC's account syncing behavior.
 */
@Export
class PartnershipDetailsAccountSyncableImpl extends AbstractPolicyContactRoleAccountSyncableImpl<PartnershipDetails_ACC> {

  static final var ACCOUNT_SYNCED_FIELDS = ImmutableSet.copyOf(
    AbstractPolicyContactRoleAccountSyncableImpl.AccountSyncedFieldsInternal.union(
      { }
    )
  )
  protected static property get AccountSyncedFieldsInternal() : Set<AccountSyncedField<AccountSyncable, Object >> {  // provided so subclasses can extend this list
    return ACCOUNT_SYNCED_FIELDS
  }

  construct(accountSyncable : PartnershipDetails_ACC) {
    super(accountSyncable)
  }

  override property get AccountSyncedFields() : Set<AccountSyncedField<AccountSyncable, Object >> {  // must override to ensure that we call the correct static AccountSyncedFieldsInternal property
    return AccountSyncedFieldsInternal
  }

}
