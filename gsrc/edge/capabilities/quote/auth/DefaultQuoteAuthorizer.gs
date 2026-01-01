package edge.capabilities.quote.auth

uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.ForAllGwNodes

class DefaultQuoteAuthorizer implements Authorizer<Submission> {
  var _userProvider: EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("quote")
  construct(aUserProvider:EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  override function canAccess(item: Submission): boolean {

    return true
  }
}
