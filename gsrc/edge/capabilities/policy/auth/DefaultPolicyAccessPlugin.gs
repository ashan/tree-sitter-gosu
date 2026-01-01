package edge.capabilities.policy.auth

uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.AuthorityType
uses edge.security.EffectiveUserProvider
/**
 * Default implementation of policy access plugin.
 */
final class DefaultPolicyAccessPlugin implements IPolicyAccessPlugin {

  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  construct(aUserProvider:EffectiveUserProvider) {
    _userProvider = aUserProvider
  }


  override function hasAccess(policy : PolicyPeriod) : Boolean {
    var user = _userProvider.EffectiveUser
    /* Explicit access to a policy by number. */
    if (user.hasAuthority(AuthorityType.POLICY, policy.PolicyNumber)) {
      return true
    }
    
    /* Access to a parent entity. */
    if (hasAccess(policy.Policy)) {
      return true
    }
    
    return false
  }


  override function hasAccess(policy : Policy) : Boolean {
    var user = _userProvider.EffectiveUser
    if (user.hasAuthority(AuthorityType.PRODUCER, policy.ProducerCodeOfService.Code)) {
      return true
    }
    
    if (user.hasAuthority(AuthorityType.ACCOUNT, policy.Account.AccountNumber)) {
      return true
    }
    
    return false
  }
}
