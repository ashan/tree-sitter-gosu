package edge.capabilities.quote.session
uses java.lang.String
uses gw.lang.Returns

/**
 * Service used to work with quote sessions.
 */
interface ISessionPlugin {
  function getSession(foreignId : String):String
  
  /**
   * Validates and refreshes a session.
   */
  @Returns("<code>true</code> iff session was valid (session timeout should be updaded)." +
           "<code>false</code> iff session is not valid")
  function validateAndRefreshSession(sessionUUID : String, foreignId : String) : boolean
}
