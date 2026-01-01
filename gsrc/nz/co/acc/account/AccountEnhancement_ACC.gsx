package nz.co.acc.account

uses gw.api.address.AddressCountrySettings
uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.path.Paths
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Key
uses nz.co.acc.constants.ProductCode
uses org.apache.commons.lang3.StringUtils
uses entity.Contact

/**
 * Enhancements for the Account entity.
 */
enhancement AccountEnhancement_ACC : Account {

  function validatePrimaryAddressState_ACC() {
    var primaryAddress = this.AccountHolderContact.PrimaryAddress
    var stateRequiredForAddress = AddressCountrySettings.getSettings(primaryAddress.Country).VisibleFields.contains(gw.api.address.AddressOwnerFieldId.STATE)
    if (stateRequiredForAddress and primaryAddress.State == null) {
      throw new DisplayableException(DisplayKey.get("Web.Policy.PrimaryAddress_ACC.NoState"))
    }
  }

  function validateNZBN_ACC() : String {
    var nzbn = this.NZBN_ACC
    if (nzbn != null and nzbn.length > 13) {
      return DisplayKey.get("Web.Account.NZBN_ACC.ExceedsMaxLength", nzbn.length)
    }
    return null
  }

  // NTK-2561 - Derive unique IR number - Policy Center
  function ShowDerivedIRDNumber() : boolean {
    //    a. IF the derived IR number and supplied IR number match, display IR number as usual.
    //    b. IF the derived IR number and supplied IR number do not match, display derived IR number in Policy Center and hide supplied IR number.
    if (this.IRDNumberDerived_ACC == null) {
      return false
    }
    if (this.IRDNumberDerived_ACC.length <= 0) {
      // there is no derived IRD number so show what we have
      // show the existing IR Number because there is no Derived
      return false
    }
    if (getNineDigitIRDNumber() == this.IRDNumberDerived_ACC) {
      // the numbers matched so show the original and hide the derived IRD Number
      return false
    } else {
      // hide the original because it's assumed it's a common IR number for this and related accounts
      // and show the Derived IRD Number
      return true
    }
  }

  private function getNineDigitIRDNumber() : String {
    if (this.IRDNumber_ACC == null) {
      return null
    } else if (this.IRDNumber_ACC.length == 9) {
      return this.IRDNumber_ACC
    } else {
      return StringUtils.leftPad(this.IRDNumber_ACC, 9, '0')
    }
  }

  public function getBalanceDateAsString() : String {
    return this.BalanceDate_ACC != null ? new java.text.SimpleDateFormat('dd/MM').format(this.BalanceDate_ACC) : null
  }

  public function isGNA_ACC() : Boolean {
    return this.AccountHolderContact.PrimaryAddress.IsGNA
  }

  public function setAccountStatusAndEndDate(accountStatus : StatusOfAccount_ACC, activeReason : ActiveReason_ACC, endDate : Date) {
    this.StatusOfAccount_ACC = accountStatus
    this.ActiveReason_ACC = activeReason
    this.TaxTypeEndDate_ACC = endDate
  }

  /**
   * Getter for the maori business info.
   * Returns null if there is no maori business info yet.
   */
  property get MaoriBusinessInfo() : MaoriBusinessInfo_ACC {
    if (this.NZBN_ACC == null) {
      return null
    }
    var existingEntity = Query.make(MaoriBusinessInfo_ACC)
        .compare(MaoriBusinessInfo_ACC#NZBN, Relop.Equals, this.NZBN_ACC)
        .select()
        .first()
    return existingEntity
  }

  /**
   * Getter for the primary contact or account holder contact if one
   * doesnt exist.
   *
   * @return the primary contact of the account if one is set, otherwise
   * returns the accountHolderContact for the account
   */
  property get PrimaryContact_ACC() : Contact {
    if (this.PrimaryAccountContactID_ACC == null or !ScriptParameters.UsePrimaryContact_ACC) {
      return this.AccountHolderContact
    } else {
      var primaryContact = Query.make(AccountContact)
          .compare(AccountContact#Account, Relop.Equals, this)
          .compare(AccountContact#ID, Relop.Equals, new Key(AccountContact, this.PrimaryAccountContactID_ACC))
          .select()
          .FirstResult
          ?.Contact
      if (primaryContact == null) {
        return this.AccountHolderContact
      } else {
        return this.Bundle.add(primaryContact)
      }
    }
  }

  property get PrimaryAccountContact_ACC() : AccountContact {
    if (not ScriptParameters.UsePrimaryContact_ACC or
        this.PrimaryAccountContactID_ACC == null or
        this.PrimaryAccountContactID_ACC.compareTo(this.AccountHolder.AccountContact.ID.Value) == 0) {
      return this.AccountHolder.AccountContact
    }

    var primaryAccountContact = Query.make(AccountContact)
        .compare(AccountContact#Account, Relop.Equals, this)
        .compare(AccountContact#ID, Relop.Equals, new Key(AccountContact, this.PrimaryAccountContactID_ACC))
        .select().AtMostOneRow

    if (primaryAccountContact == null) {
      return this.AccountHolder.AccountContact
    }

    return primaryAccountContact
  }

  public function setPrimaryContact_ACC(accountContact : AccountContact) {
    if (accountContact.Account == this) {
      this.PrimaryAccountContactID_ACC = accountContact.ID.Value
    } else {
      throw new IllegalArgumentException(
          "Cannot set AccountContact ID=${accountContact.ID} as primary contact on account ${this.ACCID_ACC}. "
              + "AccountContact has Account=${accountContact.Account.ACCID_ACC}")
    }
  }

  function addHistoryEvent(eventType : CustomHistoryType) {
    if (eventType == CustomHistoryType.TC_PRIMARY_CONTACT_CHANGED_ACC) {
      this.createCustomHistoryEvent(CustomHistoryType.TC_PRIMARY_CONTACT_CHANGED_ACC, \-> DisplayKey.get("AccountContact.Primary.Changed_ACC", this.PrimaryContact_ACC.DisplayName))
    }
  }


  property get DisplayStatus_ACC() : String {
    if (this.ActiveReason_ACC != null) {
      return "${this.StatusOfAccount_ACC}-${this.ActiveReason_ACC}"
    } else {
      return this.StatusOfAccount_ACC.toString()
    }
  }

  property get DisplayStatusForSummary_ACC() : String {
    if (this.ActiveReason_ACC != null) {
      return "${this.StatusOfAccount_ACC.DisplayName} (${this.ActiveReason_ACC.DisplayName})"
    } else {
      return this.StatusOfAccount_ACC.DisplayName ?: ""
    }
  }

  static function exists_ACC(accID : String) : boolean {
    return Query.make(Account)
        .compare(Account#ACCID_ACC, Relop.Equals, accID)
        .select()
        .getCountLimitedBy(1) > 0
  }

  function hasWPSPolicy_ACC() : Boolean {
    return this.Policies.hasMatch(\policy -> policy.ProductCode_ACC == ProductCode.ShareholdingCompany)
  }

  function hasCPOrCPXPolicy_ACC() : Boolean {
    return this.Policies.hasMatch(\policy -> policy.ProductCode_ACC == ProductCode.IndividualACC)
  }

  property get SecureMessageThreads_ACC() : IQueryBeanResult<SecureMessageThread_ACC> {
    return Query.make(SecureMessageThread_ACC)
        .compare(SecureMessageThread_ACC#Account, Relop.Equals, this)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(SecureMessageThread_ACC#CreateTime)))
        as IQueryBeanResult<SecureMessageThread_ACC>
  }

  property get PrimaryContactsAttentionField_ACC() : String {
    var attention = this.PrimaryContact_ACC.PrimaryAddress.Attention_ACC
    if(this.PrimaryContact_ACC != this.AccountHolderContact and attention == null){
      attention = this.PrimaryContact_ACC.DisplayName
    }
    return attention
  }

  property get EntityTypeAndClassForSummary_ACC() : String {
    var entityType = this.EntityType_ACC
    var entityClass = this.EntityClass_ACC
    if(entityType == null and entityClass == null) {
      return ""
    } else {
      return DisplayKey.get("Web.AccountFile.Summary.EntityValue_ACC", entityType?:"NULL", entityClass?:"NULL")
    }
  }

}