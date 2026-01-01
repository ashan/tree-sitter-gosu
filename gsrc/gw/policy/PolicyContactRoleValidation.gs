package gw.policy

uses gw.api.locale.DisplayKey
uses gw.validation.PCValidationBase
uses gw.validation.PCValidationContext


@Export
class PolicyContactRoleValidation extends PCValidationBase {

  var _policyRole : PolicyContactRole as PolicyRole

  construct(valContext : PCValidationContext, role : PolicyContactRole) {
    super(valContext)
    _policyRole = role
  }

  override protected function validateImpl() {
    Context.addToVisited( this, "validateImpl" )

    allAccountContactsAreActive()
    missingInformationForPolicyRole_ACC()
  }

  function allAccountContactsAreActive() {
    Context.addToVisited(this, "allAccounContactsAreActive")
    if (Context.isAtLeast(TC_QUOTABLE)) {
      if (!PolicyRole.AccountContactRole.AccountContact.Active) {
        Result.addError(PolicyRole.Branch, TC_QUOTABLE, DisplayKey.get("Web.Policy.PolicyContact.Validation.NotActive", PolicyRole.DisplayName))
      }
    }
  }

  function missingInformationForPolicyRole_ACC(){
    Context.addToVisited(this, "missingInformationForPolicyRole_ACC")

    if (PolicyRole typeis PolicyShareholder_ACC) {
      if (PolicyRole.PolicyContact.ACCID_ACC == null and !PolicyRole.PolicyContact.DummyContact_ACC) {
        Result.addError(PolicyRole.Branch, ValidationLevel.TC_LOADSAVE, DisplayKey.get("Web.Policy.PolicyContact.Validation.ACCIDRequiredForShareholder_ACC", PolicyRole.DisplayName))
      }
    }
  }
}
