package gw.policy

uses gw.plugin.Plugins
uses gw.plugin.contact.IContactConfigPlugin
uses typekey.PolicyContactRole

enhancement APDPolicyPeriodEnhancement : PolicyPeriod {

  property get APDInvolvedPartyOtherCandidates(): AccountContactView[] {
    var plugin = Plugins.get(IContactConfigPlugin)
    var accountContactRoleType = plugin.getAccountContactRoleTypeFor(TC_APDPOLICYINVOLVEDPARTY)
    var accountContacts = this.Policy.Account.AccountContacts
    return accountContacts.where(\ac -> plugin.canBeRole(ac.ContactType, accountContactRoleType) and
        not ac.hasRole(accountContactRoleType)).asViews()
  }

  property get UnassignedAPDInvolvedParties(): AccountContactView[] {
    var plugin = Plugins.get(IContactConfigPlugin)
    var accountContactRoleType = plugin.getAccountContactRoleTypeFor(TC_APDPOLICYINVOLVEDPARTY)
    var assignedInvolvedParties = this.PolicyContactRoles.whereTypeIs(APDPolicyInvolvedParty).map(\ni -> ni.AccountContactRole.AccountContact)
    return this.Policy.Account.getAccountContactsWithRole(accountContactRoleType)
        .subtract(assignedInvolvedParties)
        .toTypedArray().asViews()
  }


}
