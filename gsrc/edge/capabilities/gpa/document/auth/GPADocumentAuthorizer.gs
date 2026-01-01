package edge.capabilities.gpa.document.auth

uses edge.security.authorization.Authorizer
uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.ForAllGwNodes

class GPADocumentAuthorizer implements Authorizer<Document> {

  private var _policyAuthCheck : IPolicyAccessPlugin
  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("gpa")
  construct(policyAuthCheck : IPolicyAccessPlugin) {
    this._policyAuthCheck = policyAuthCheck
  }

  /**
   * Checks if user can access a given document.
   */
  override function canAccess(doc : Document) : boolean {

    var hasPolicyAccess = _policyAuthCheck.hasAccess(doc.Policy)

    return isPortalDefaultAccessible(doc) && perm.Document.view(doc) && hasPolicyAccess
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

