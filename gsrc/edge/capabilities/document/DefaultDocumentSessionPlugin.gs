package edge.capabilities.document

uses edge.di.annotations.ForAllGwNodes
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses edge.security.EffectiveUserProvider
uses gw.api.util.DateUtil
uses edge.PlatformSupport.PortalStringUtils
uses gw.api.database.Query
uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.PlatformSupport.Bundle
uses java.util.UUID
uses java.util.Date

/**
 * Default implementation of document session plugin.
 */
final class DefaultDocumentSessionPlugin implements IDocumentSessionPlugin {
  private static final var DEFAULT_SESSION_ID = "00000000"
  public static final var DOCUMENT_SESSION_EXPIRATION_MINUTES : int = 20

  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  construct(aUserProvider:EffectiveUserProvider) {
    _userProvider = aUserProvider
  }


  override function getDocumentSession() : String {
//    var uuid = UUID.randomUUID().toString()
//    var username = UserProvider.EffectiveUser.Username
//
//    final var sess = Bundle.resolveInTransaction(\ bundle -> {
//      final var mtSession = new PortalSession_MPExt()
//      mtSession.sessionType = "Document"
//      mtSession.sessionUUID = uuid
//      mtSession.username = username
//      mtSession.issueDate = DateUtil.currentDate()
//      mtSession.foreignId = uuid
//      return mtSession
//    });
//    return sess.sessionUUID

    return DEFAULT_SESSION_ID
  }

  override function isSessionValid(sessionUUID: String): Boolean {
//    if (PortalStringUtils.isBlank(sessionUUID)) {
//      return false
//    }
//
//    final var results = Query.make(PortalSession_MPExt).compare("sessionUUID", Equals, sessionUUID).select()
//    if (results.Count != 1) {
//      throw new JsonRpcSecurityException(){: Message = "Invalid session"}
//    }
//    final var sess = results.FirstResult
//
//
//    if (!"Document".equals(sess.sessionType)) {
//      return false
//    }
//
//    if (!DateUtil.addHours(sess.issueDate, DOCUMENT_SESSION_EXPIRATION_MINUTES).after(Date.CurrentDate)) {
//      return false
//    }
//
//    Bundle.transaction(\bundle -> {
//      final var bundledSession = bundle.add(sess)
//      bundledSession.issueDate = DateUtil.currentDate()
//    })

    return true
  }

  override property get Expiration(): int {
    return DOCUMENT_SESSION_EXPIRATION_MINUTES
  }
}
