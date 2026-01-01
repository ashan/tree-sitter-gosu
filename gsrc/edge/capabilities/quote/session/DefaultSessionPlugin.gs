package edge.capabilities.quote.session

uses edge.PlatformSupport.PortalStringUtils
uses edge.di.annotations.ForAllGwNodes
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses edge.PlatformSupport.Bundle
uses gw.api.database.Query
uses gw.api.util.DateUtil

uses java.util.Date
uses java.util.UUID
uses edge.PlatformSupport.Bundle

/**
 * Default implementation of session plugin.
 */
class DefaultSessionPlugin implements ISessionPlugin {
  /**
   * Expiration window in hours
   */
  public static final var DEFAULT_EXPIRY_HOURS:int = 1
  private static final var DEFAULT_SESSION_ID = "00000000"
  
  @ForAllGwNodes
  construct() {

  }

  override function getSession(foreignId : String) : String {
//    final var sess = Bundle.resolveInTransaction(\ bundle -> {
//      final var mtSession = new PortalSession_MPExt()
//      mtSession.foreignId = foreignId
//      mtSession.sessionType = "Submission"
//      mtSession.sessionUUID = UUID.randomUUID().toString()
//      mtSession.issueDate = DateUtil.currentDate()
//      return mtSession
//    })
//    return sess.sessionUUID

    return DEFAULT_SESSION_ID
  }
  

  override function validateAndRefreshSession(sessionUUID : String, foreignId : String) : boolean {
//    if (PortalStringUtils.isBlank(sessionUUID)) {
//      return false
//    }
//
//    final var results = Query.make(PortalSession_MPExt).compare("sessionUUID", Equals, sessionUUID).select()
//    if(results.Count != 1) {
//      throw new JsonRpcSecurityException(){:Message = "Invalid session"}
//    }
//    final var sess = results.FirstResult
//
//    if (!sess.foreignId.equals(foreignId)) {
//      return false
//    }
//
//    if (!"Submission".equals(sess.sessionType)) {
//      return false
//    }
//
//    if (!DateUtil.addDays(sess.issueDate, DEFAULT_EXPIRY_HOURS).after( Date.CurrentDate)) {
//      return false
//    }
//
//    Bundle.transaction(\ bundle -> {
//      final var bundledSession = bundle.add(sess)
//      bundledSession.issueDate = DateUtil.currentDate()
//    })
    
    return true
  }

}
