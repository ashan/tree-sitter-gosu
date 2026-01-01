package nz.co.acc.lob.shc.contact

uses com.google.common.collect.ImmutableSet
uses gw.account.PersonToPolicyContactRoleSyncedField
uses gw.api.domain.account.AccountSyncable
uses gw.api.domain.account.AccountSyncedField
uses gw.contact.AbstractPolicyContactRoleAccountSyncableImpl

/**
 * Implementation that handles PolicyShareholder_ACC's account syncing behavior.
 */
@Export
class PolicyShareholderAccountSyncableImpl extends AbstractPolicyContactRoleAccountSyncableImpl<PolicyShareholder_ACC> {

  static final var ACCOUNT_SYNCED_FIELDS = ImmutableSet.copyOf(
    AbstractPolicyContactRoleAccountSyncableImpl.AccountSyncedFieldsInternal.union(
      { }
    )
  )
  protected static property get AccountSyncedFieldsInternal() : Set<AccountSyncedField<AccountSyncable, Object >> {  // provided so subclasses can extend this list
    return ACCOUNT_SYNCED_FIELDS
  }

  construct(accountSyncable : PolicyShareholder_ACC) {
    super(accountSyncable)
  }

  override property get AccountSyncedFields() : Set<AccountSyncedField<AccountSyncable, Object >> {  // must override to ensure that we call the correct static AccountSyncedFieldsInternal property
    return AccountSyncedFieldsInternal
  }

}
