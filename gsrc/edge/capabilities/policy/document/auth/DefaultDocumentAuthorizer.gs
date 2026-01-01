package edge.capabilities.policy.document.auth

uses edge.di.annotations.ForAllGwNodes
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses edge.security.authorization.exception.NoAuthorityException
uses edge.security.authorization.Authorizer
uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.security.EffectiveUserProvider


class DefaultDocumentAuthorizer implements Authorizer<Document> {

  private var _policyAuthCheck : IPolicyAccessPlugin
  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("policy")
  @ForAllGwNodes("document")
  @Param("policyAuthCheck", "Policy access policy")
  construct(policyAuthCheck : IPolicyAccessPlugin, aUserProvider : EffectiveUserProvider) {
    this._policyAuthCheck = policyAuthCheck
    this._userProvider = aUserProvider
  }

  /**
   * Checks if user can access a given document.
   */
  override function canAccess(doc : Document) : boolean {
    if (!canAccessDocumentPolicy(doc)) {
      //throw new NoAuthorityException()
      throw new JsonRpcSecurityException(){: Message = "Document doesn't belongs to this account or invalid document public id has been provided"}
    }
    return isPortalDefaultAccessible(doc) && perm.Document.view(doc)
  }

  /**
   * Checks if given user can access a policy of the document.
   */
  protected function canAccessDocumentPolicy(doc : Document) : Boolean {
    if (doc.Policy != null && _policyAuthCheck.hasAccess(doc.Policy)) {
      return true
    }

    if (doc.PolicyPeriod != null && _policyAuthCheck.hasAccess(doc.PolicyPeriod)) {
      return true
    }

    return false
  }

  /**
   * Checks if document is accessible to any portal. Some documents may be restricted
   * for the portal users (like sensitive documents or internal documents).
   */
  static function isPortalDefaultAccessible(document : Document) : Boolean {
    return
        document.SecurityType != DocumentSecurityType.TC_SENSITIVE &&
            document.SecurityType != DocumentSecurityType.TC_INTERNALONLY &&
            !document.Obsolete && !document.Retired
  }

}
