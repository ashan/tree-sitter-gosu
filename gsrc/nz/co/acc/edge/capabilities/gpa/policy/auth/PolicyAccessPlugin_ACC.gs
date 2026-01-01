package nz.co.acc.edge.capabilities.gpa.policy.auth

uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.di.annotations.ForAllNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType

/**
 * Created by lee.teoh on 23/05/2017.
 */
class PolicyAccessPlugin_ACC implements IPolicyAccessPlugin {

  var _userProvider : EffectiveUserProvider

  @ForAllNodes
  construct(aUserProvider: EffectiveUserProvider) {
    this._userProvider = aUserProvider
  }

  override function hasAccess(policy : PolicyPeriod) : Boolean {
    var user = _userProvider.EffectiveUser
    /* Explicit access to a policy by number. */
    if (user.hasAuthority(AuthorityType.POLICY, policy.PolicyNumber)) {
      return Boolean.TRUE
    }
    /* Access to a parent entity. */
    if (hasAccess(policy.Policy)) {
      return Boolean.TRUE
    }
    return Boolean.FALSE
  }


  override function hasAccess(policy : Policy) : Boolean {
    var user = _userProvider.EffectiveUser
    if (user.hasAuthority(AuthorityType.PRODUCER, policy.ProducerCodeOfService.Code)) {
      return Boolean.TRUE
    }
    if (user.hasAuthority(AuthorityType.ACCOUNT, policy.Account.ACCID_ACC)) {
      return Boolean.TRUE
    }
    return Boolean.FALSE
  }
}