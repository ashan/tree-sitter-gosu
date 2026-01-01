package nz.co.acc.edge.capabilities.policychange.auth

uses edge.capabilities.policychange.auth.DefaultPolicyAuthorizer
uses edge.di.annotations.ForAllNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType

/**
 * Created by lee.teoh on 26/06/2017.
 */
class PolicyAuthorizer_ACC extends DefaultPolicyAuthorizer{
  private var _userProvider: EffectiveUserProvider as readonly UserProvider

  @ForAllNodes("policychange")
  construct(aUserProvider: EffectiveUserProvider) {
    super(aUserProvider)
    this._userProvider = aUserProvider
  }

  override function canAccess(item: PolicyPeriod): boolean {
    if ( _userProvider.EffectiveUser.hasAuthority(AuthorityType.POLICY, item.LatestPeriod.PolicyNumber)) {
      return true
    }

    if ( _userProvider.EffectiveUser.hasAuthority(AuthorityType.ACCOUNT, item.Policy.Account.ACCID_ACC)) {
      return true
    }
    return false
  }
}