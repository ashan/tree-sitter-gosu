package edge.capabilities.policy.document.auth

uses edge.security.authorization.Authorizer
uses edge.security.authorization.DefaultAuthorizerPlugin
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.ForAllGwNodes

class DefaultDocumentAuthorizerProviderPlugin extends DefaultAuthorizerPlugin {

  @ForAllGwNodes("policy")
  @ForAllGwNodes("document")
  @Param("auserProvider", "Provider of effective user")
  construct(aUserProvider : EffectiveUserProvider, documentAuthorizer:Authorizer<Document>) {

    super(aUserProvider)
    Authorizers.put(Document, documentAuthorizer)
  }
}
