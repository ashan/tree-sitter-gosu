package nz.co.acc.integration.junoinformationservice.preupdate


uses nz.co.acc.integration.junoinformationservice.messaging.JISMessageEvents
uses gw.surepath.suite.integration.logging.StructuredLogger
uses entity.Address
uses entity.Contact
uses nz.co.acc.validforclaims.ValidForClaimsUtil
uses typekey.Job

/**
 * Triggers events for Juno Information Service integration.
 * <p>
 * Created by Mike Ourednik on 14/08/20.
 */
class JISPreupdateHandler {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(JISPreupdateHandler)

  // Avoid triggering duplicate events during preupdate
  private var _changedEntities = new HashSet<KeyableBean>(8)

  public function handleContactChanged(contact : Contact) {
    if (isEnabled()) {
      var bundle = contact.Bundle

      for (accountContact in contact.AccountContacts) {
        var account = bundle.add(accountContact.Account)
        addAccountChangeEventWithPreconditions(account, "contact")
      }
    }
  }

  public function handleAccountContactRoleChanged(accountContactRole : AccountContactRole) {
    if (isEnabled()) {
      addAccountChangeEventWithPreconditions(accountContactRole.AccountContact.Account, "accountContactRole")
    }
  }

  public function handleAccreditationChanged(accreditation : Accreditation_ACC) {
    handleContactChanged(accreditation.Person)
  }

  public function handleAccountContactChanged(accountContact : AccountContact) {
    if (isEnabled()) {
      addAccountChangeEventWithPreconditions(accountContact.Account, "accountContact")
    }
  }

  public function handleAddressChanged(address : Address) {
    if (isEnabled()) {
      var linkedContacts = address.findLinkedContacts_ACC()
      if (linkedContacts.Empty) {
        return
      }

      var bundle = address.Bundle

      for (linkedContact in linkedContacts) {
        for (accountContact in linkedContact.AccountContacts) {
          var account = bundle.add(accountContact.Account)
          addAccountChangeEventWithPreconditions(account, "address")
        }
      }
    }
  }

  public function handleAccountChanged(account : Account) {
    if (isEnabled()) {
      if (isAccountChangeRelevant(account)) {
        addAccountChangeEventWithPreconditions(account, "account")
      } else {
        if (_log.DebugEnabled) {
          _log.debug("Ignoring account change for ACCID=${account.ACCID_ACC}, changedFields=${account.ChangedFields}")
        }
      }
    }
  }

  private function isAccountChangeRelevant(account : Account) : Boolean {
    var changedFields = account.ChangedFields
//    _log.info("DEBUG account ACCID=${account.ACCID_ACC}, changedFields=${changedFields}")

    if (changedFields.Count == 1) {
      if (account.isFieldChanged(Account#StatusWorkQueuePending_ACC)
          or account.isFieldChanged(Account#BalanceDate_ACC)
          or changedFields.contains(Account#JobGroups.PropertyInfo.Name)) {
        return false
      }
    }
    return true
  }

  function handleMaoriBusinessInfo(maoriBusinessInfoEntity : MaoriBusinessInfo_ACC) : void {
    if (isEnabled()) {
      var accountsToChange = maoriBusinessInfoEntity.getRelatedAccounts()
      var currentBundle = maoriBusinessInfoEntity.Bundle
      foreach (acc in accountsToChange) {
        currentBundle.add(acc)
        addAccountChangeEventWithPreconditions(acc, "maoriBusinessInfo")
      }
    }
  }

  public function handleAccountLocationChanged(accountLocation : AccountLocation) {
    if (isEnabled()) {
      addAccountChangeEventWithPreconditions(accountLocation.Account, "accountLocation")
    }
  }

  public function handleAEPAccountComplianceDetailsChanged(details : AEPAccountComplianceDetail_ACC) {
    if (isEnabled()) {
      addAccountChangeEventWithPreconditions(details.Account, "AEPAccountComplianceDetails")
    }
  }

  public function handlePolicyPeriodChanged(policyPeriod : PolicyPeriod, isVFCUpdate : boolean = false) {
    if (isEnabled() and policyPeriodPreconditions(policyPeriod)) {

      if (isVFCUpdate
          or (policyPeriod.isFieldChanged(PolicyPeriod#Status)
          and (policyPeriod.Status == PolicyPeriodStatus.TC_BOUND
          or policyPeriod.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE))) {

        if (policyPeriod.isAuditReversal_ACC) {
          // Ignore audit reversal.
          // The policy change which caused the audit reversal will be sent instead.
        } else {
          var isRenewal = policyPeriod.Job.Subtype == Job.TC_RENEWAL

          if (policyPeriod.PolicyTerm.MostRecentTerm) {
            // "accounts" document also needs to be updated with latest policy info
            if (isRenewal and not isVFCUpdate) {
              addAccountChangeRenewalEvent(policyPeriod.Policy.Account)
            } else {
              addAccountChangeLatestPolicyEvent(policyPeriod.Policy.Account)
            }
          }
          if (isRenewal and not isVFCUpdate) {
            addPolicyChangeRenewalEvent(policyPeriod)
          } else {
            addPolicyChangeEvent(policyPeriod)
          }
        }
      }
    }
  }

  public function handlePolicyTermChanged(policyterm : PolicyTerm) {
    if (policyterm.isFieldChanged(PolicyTerm#ActiveTerm_ACC)) {
      var latestPeriod = policyterm.findLatestBoundOrAuditedPeriod_ACC()
      latestPeriod = policyterm.Bundle.add(latestPeriod)
      handlePolicyPeriodChanged(latestPeriod)
    } else if (policyterm.isFieldChanged(PolicyTerm#ValidForClaimsReg_ACC)) {
      var latestPeriod = policyterm.findLatestBoundOrAuditedPeriod_ACC()
      latestPeriod = policyterm.Bundle.add(latestPeriod)
      handlePolicyPeriodChanged(latestPeriod, true)
    }
  }

  public function handlePolicyChanged(policy : Policy) {
    if (policy.isFieldChanged(Policy#ClientID_ACC)) {
      if (policy.PolicyTermFinder_ACC.policyTermExists()) {
        addAccountChangeEventWithPreconditions(policy.Account, "Policy.ClientID_ACC")
      }

    } else if (policy.isFieldChanged(Policy#IPS2EmployerID_ACC)) {
      if (policy.PolicyTermFinder_ACC.policyTermExists()) {
        addAccountChangeEventWithPreconditions(policy.Account, "Policy.IPS2EmployerID_ACC")
      }
    }
  }

  private function accountPreconditions(account : Account) : Boolean {
    if (_changedEntities.contains(account)) {
      return false
    }

    if (not account.HasPolicy_ACC) {
      return false
    }

//    var hasPendingVFCUpdate = ValidForClaimsUtil.hasPendingVFCUpdateForLatestTerm(account)
//    if (hasPendingVFCUpdate) {
//      return false
//    }

    return true
  }

  private function policyPeriodPreconditions(policyPeriod : PolicyPeriod) : Boolean {
    if (_changedEntities.contains(policyPeriod)) {
      return false
    }

    if (policyPeriod.PeriodStart == policyPeriod.CancellationDate) {
      // ignore policy period canceled/rewritten to AEP immediately at start of term
      return false
    }

    if (policyPeriod.PolicyTerm.VFCUpdatePending_ACC) {
      _log.info("Period ${policyPeriod} on account ${policyPeriod.PolicyTerm.Policy.Account.ACCID_ACC} has VFCUpdatePending_ACC=true. Not triggering JIS updates")
      // Do not send until ValidForClaims is updated
      return false
    }

    return true
  }

  private function addAccountChangeEventWithPreconditions(account : Account, trigger : String) {
    if (accountPreconditions(account)) {
      addAccountChangeEvent(account, trigger)
    }
  }

  private function addAccountChangeEvent(account : Account, trigger : String) {
    if (not _changedEntities.contains(account)) {
      _changedEntities.add(account)
      _log.info("${JISMessageEvents.EVENT_ACCOUNT_CHANGE}:${account.ACCID_ACC} [${trigger}]")
      account.addEvent(JISMessageEvents.EVENT_ACCOUNT_CHANGE)
    }
  }

  private function addAccountChangeLatestPolicyEvent(account : Account) {
    if (not _changedEntities.contains(account)) {
      _changedEntities.add(account)
      _log.info("${JISMessageEvents.EVENT_ACCOUNT_CHANGE_LATEST_POLICY}:${account.ACCID_ACC}")
      account.addEvent(JISMessageEvents.EVENT_ACCOUNT_CHANGE_LATEST_POLICY)
    }
  }

  private function addAccountChangeRenewalEvent(account : Account) {
    if (not _changedEntities.contains(account)) {
      _changedEntities.add(account)
      _log.info("${JISMessageEvents.EVENT_ACCOUNT_CHANGE_RENEWAL}:${account.ACCID_ACC}")
      account.addEvent(JISMessageEvents.EVENT_ACCOUNT_CHANGE_RENEWAL)
    }
  }

  private function addPolicyChangeEvent(period : PolicyPeriod) {
    if (not _changedEntities.contains(period)) {
      _changedEntities.add(period)
      _log.info("${JISMessageEvents.EVENT_POLICY_CHANGE}:${period.JunoInfoServiceDisplayName_ACC}")
      period.addEvent(JISMessageEvents.EVENT_POLICY_CHANGE)
    }
  }

  private function addPolicyChangeRenewalEvent(period : PolicyPeriod) {
    if (not _changedEntities.contains(period)) {
      _changedEntities.add(period)
      _log.info("${JISMessageEvents.EVENT_POLICY_CHANGE_RENEWAL}:${period.JunoInfoServiceDisplayName_ACC}")
      period.addEvent(JISMessageEvents.EVENT_POLICY_CHANGE_RENEWAL)
    }
  }

  private function isEnabled() : Boolean {
    return ScriptParameters.JunoInformationServiceMessageQueueEnabled_ACC
  }

}