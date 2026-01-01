package nz.co.acc.edge.capabilities.gpa.document.auth

uses edge.capabilities.gpa.document.auth.GPADocumentAuthorizer
uses edge.capabilities.helpers.AccountUtil
uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.di.annotations.ForAllNodes
uses edge.security.EffectiveUser
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType

/**
 * Created by lee.teoh on 18/05/2017.
 */
class GPADocumentAuthorizer_ACC extends GPADocumentAuthorizer {
  private enum DocumentLevel {AccountLevel, PolicyLevel}
  private var _policyAuthCheck : IPolicyAccessPlugin
  private var _userProvider : EffectiveUserProvider

  @ForAllNodes("gpa")
  construct(policyAuthCheck : IPolicyAccessPlugin, aUserProvider : EffectiveUserProvider) {
    super(policyAuthCheck)
    this._policyAuthCheck = policyAuthCheck
    this._userProvider = aUserProvider
  }

  /**
   * Checks if user can access a given document.
   */
  override function canAccess(doc : Document) : boolean {
    var documentLevel = getDocumentLevel(doc)
    var portalAccessibleDoc = isPortalDefaultAccessible(doc)
    var hasDocumentAuthorithy = hasDocumentAuthorithy(doc.Account.ACCID_ACC)
    if (documentLevel == DocumentLevel.PolicyLevel) {
      var policyAuthCheck = _policyAuthCheck.hasAccess(doc.Policy)
      return portalAccessibleDoc and (policyAuthCheck or hasDocumentAuthorithy)
    }
    var hasAccountAccess = _userProvider.EffectiveUser.hasAuthority(AuthorityType.ACCOUNT, doc.Account.ACCID_ACC)
    return portalAccessibleDoc and (hasAccountAccess or hasDocumentAuthorithy)
  }

  private function getDocumentLevel(doc : Document) : DocumentLevel {
    if (doc.Policy != null) {
      return DocumentLevel.PolicyLevel
    }
    return DocumentLevel.AccountLevel
  }

  private function hasDocumentAuthorithy(accid : String) : Boolean {
    var user = _userProvider.EffectiveUser
    if (accid != null and user.hasAuthority(AuthorityType.ACCOUNT, accid)) {
      return Boolean.TRUE
    }
    return Boolean.FALSE
  }
}