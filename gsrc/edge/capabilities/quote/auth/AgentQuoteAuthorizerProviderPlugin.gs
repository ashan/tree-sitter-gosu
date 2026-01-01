package edge.capabilities.quote.auth

uses edge.security.authorization.Authorizer
uses edge.security.authorization.DefaultAuthorizerPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider

class AgentQuoteAuthorizerProviderPlugin extends DefaultAuthorizerPlugin {
  @ForAllGwNodes("agentquote")
  @Param("auserProvider", "Provider of effective user")
  construct(aUserProvider : EffectiveUserProvider, quoteAuthorizer:Authorizer<Submission>) {
    super(aUserProvider)
    Authorizers.put(Submission,quoteAuthorizer)
  }
}
