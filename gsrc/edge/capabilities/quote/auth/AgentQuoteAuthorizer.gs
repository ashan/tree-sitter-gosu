package edge.capabilities.quote.auth

uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.di.annotations.ForAllGwNodes
class AgentQuoteAuthorizer  implements Authorizer<Submission> {
  var _userProvider: EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("agentquote")
  construct(aUserProvider:EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  override function canAccess(item: Submission): boolean {

    if ( _userProvider.EffectiveUser.hasAuthority(AuthorityType.PRODUCER, item.getPolicy().ProducerCodeOfService.Code)) {
      return true
    }
    return false
  }
}
