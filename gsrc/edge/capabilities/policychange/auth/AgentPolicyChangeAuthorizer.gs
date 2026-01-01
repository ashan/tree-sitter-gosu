package edge.capabilities.policychange.auth

uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.di.annotations.ForAllGwNodes

class AgentPolicyChangeAuthorizer implements Authorizer<PolicyPeriod> {
    var _userProvider: EffectiveUserProvider as readonly UserProvider

    @ForAllGwNodes("agentpolicychange")
    construct(aUserProvider:EffectiveUserProvider) {
      _userProvider = aUserProvider
    }

    override function canAccess(item: PolicyPeriod): boolean {

      if ( _userProvider.EffectiveUser.hasAuthority(AuthorityType.PRODUCER, item.Policy.ProducerCodeOfService.Code)) {
        return true
      }
      return false
    }
}
