package edge.capabilities.gpa.document.auth

uses edge.security.authorization.DefaultAuthorizerPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.Authorizer

class GPADocumentAuthorizerProvider extends DefaultAuthorizerPlugin {

  @ForAllGwNodes("gpa")
  @Param("auserProvider", "Provider of effective user")
  construct(aUserProvider : EffectiveUserProvider, docAuthorizer: Authorizer<Document>) {
    super(aUserProvider)
    Authorizers.put(Document, docAuthorizer)
  }
}
