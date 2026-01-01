package edge.capabilities.quote.auth

uses edge.security.authorization.Authorizer
uses edge.security.authorization.DefaultAuthorizerPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
class DefaultQuoteAuthorizerProviderPlugin extends DefaultAuthorizerPlugin {
  @ForAllGwNodes("quote")
  @Param("auserProvider", "Provider of effective user")
  construct(aUserProvider : EffectiveUserProvider, quoteAuthorizer:Authorizer<Submission>) {
    super(aUserProvider)
  }
}
