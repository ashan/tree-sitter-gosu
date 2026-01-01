package edge.capabilities.policychange.auth

uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.di.annotations.ForAllGwNodes

class DefaultPolicyAuthorizer implements Authorizer<PolicyPeriod> {
  var _userProvider: EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("policychange")
  construct(aUserProvider:EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  override function canAccess(item: PolicyPeriod): boolean {
    if ( _userProvider.EffectiveUser.hasAuthority(AuthorityType.POLICY, item.LatestPeriod.PolicyNumber)) {
      return true
    }

    if ( _userProvider.EffectiveUser.hasAuthority(AuthorityType.ACCOUNT, item.Policy.Account.AccountNumber)) {
      return true
    }
    return false
  }
}
