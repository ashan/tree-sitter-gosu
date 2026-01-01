package edge.samlV2.idp

uses edge.samlV2.util.SAMLBuilder
uses com.guidewire.pl.web.controller.WebRequestInfo
uses gw.api.util.Logger
uses gw.api.webservice.login.LoginAPIHelper
uses gw.servlet.AbstractGWAuthServlet
uses gw.servlet.Servlet

uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse
uses java.lang.Exception
uses java.lang.Throwable
uses java.util.Map
uses java.util.concurrent.ConcurrentHashMap

/**
 *
 *
 *
 *
 */
@Servlet("/sso")
class SAMLV2IdP extends AbstractGWAuthServlet {
  /**
   * Last time we checked to expire sessions
   */
  public static var lastSessionPurge:org.joda.time.DateTime = org.joda.time.DateTime.now()

  /**
   * Class level logger used for ongoing log messaging,  and debug/trace logging
   */
  public static final var logger:org.slf4j.Logger = Logger.forCategory(SAMLV2IdP.Type.DisplayName)

  construct() {
  }

  public static property get SessionList():Map<String, SAMLSession> {
    var sessionMap = gw.api.web.Scopes.Application.get(SAMLImpl.SESSION_KEY) as Map<String, SAMLSession> //Emerald: Need backwards compatibility to Diamond/Emerald
    if ( sessionMap == null ) {
      sessionMap = generateSessionMap()
    } else {
      if(lastSessionPurge.plusHours(1).BeforeNow) { // If we haven't purged in X time (decide how long X is),  will purge sessions anytime the last time it checked was more than an hour ago
        cleanupSessions()
      }
    }
    return sessionMap
  }

  protected static function generateSessionMap():Map<String, SAMLSession> {
    var sessionMap = new ConcurrentHashMap<String,SAMLSession>()
    gw.api.web.Scopes.Application.put(SAMLImpl.SESSION_KEY, sessionMap)  //Emerald: Need backwards compatibility to Diamond/Emerald
    return sessionMap
  }

  protected static function cleanupSessions() {
    var iter = (gw.api.web.Scopes.Application.get(SAMLImpl.SESSION_KEY) as Map<String, SAMLSession>).entrySet().iterator()
    while(iter.hasNext()) {
      var session = iter.next()
      if(session.Value.Expired) {
        iter.remove()
      }
    }
  }

  protected function addSession(username:String, sessionIndex:String, expiry:org.joda.time.DateTime) {
    var s = new SAMLSession(username, sessionIndex, expiry)
    SessionList.put(sessionIndex, s)
  }

  override public function doGet(request:HttpServletRequest, response:HttpServletResponse) {
    logger.info("#doGet - Enter")
    if(gw.api.system.server.ServerModeUtil.isDev()) { // For testing,  this will blow away the session map, invalidating any sessions currently present, not available outside of development mode
      if(request.getParameter(SAMLImpl.SESSION_PURGE_HEADER) == "1") {
        generateSessionMap()
      }
    }
    request.setAttribute(SAML.RELAYSTATE, request.getParameter(SAML.RELAYSTATE))
    request.setAttribute(SAML.REQUEST, request.getParameter(SAML.REQUEST))

    response.setContentType("text/html")
    response.setCharacterEncoding("UTF-8")

    WebRequestInfo.Util.setNoCacheHeader(response)
    request?.getRequestDispatcher("../sso-login.jsp")?.include(request, response) //We're including our html input screen so we can capture a username and password to validate against
    logger.info("#doGet - Leave")
  }

  override public function doPost(req: HttpServletRequest, resp: HttpServletResponse) {
    var samlReqParams = new SAMLRequestParameters (req)
    var authenticated:Boolean = Boolean.FALSE
    if(gw.api.system.server.ServerModeUtil.isDev()) {
      logger.info("#doPost - Enter")
      logger.info("request" + req.getParameter(SAML.REQUEST))
      logger.info("Returning to: " + samlReqParams.ReturnPage)
    }

    if(!samlReqParams.ValidRequest) {
      logger.info("#doPost - bad saml request")
      req.setAttribute("error", "ERROR: Unspecified SAML parameters.")
    } else {
      if(gw.api.system.server.ServerModeUtil.isDev()) {logger.info("#doPost - trying to process request")}
      try {
        authenticated = samlAuthenticate(samlReqParams)

        if(gw.api.system.server.ServerModeUtil.isDev()) {logger.info("#doPost - trying to process response")}
        var samlRespParams = new SAMLResponseParameters(authenticated)

        if(gw.api.system.server.ServerModeUtil.isDev()) {logger.info("#doPost - creating response")}

        var signedResponse = new SAMLBuilder().getResponse(samlReqParams, samlRespParams) // Generate our SAML Assertion
        addSession(samlReqParams.Username, samlRespParams.AssertionId, samlRespParams.NotOnOrAfter) // Track the session for SSO and SLO purposes

        req.setAttribute(SAML.RELAY_STATE_URL, samlReqParams.RelayStateURL)
        req.setAttribute(SAML.ACSURL, samlReqParams.ACSUrl)
        req.setAttribute(SAML.RESPONSE, signedResponse)
      } catch (e : Exception) {
        req.setAttribute("error", e.getMessage())
      }
    }
    resp.setContentType("text/html")
    resp.setCharacterEncoding("UTF-8")
    if(gw.api.system.server.ServerModeUtil.isDev()) {logger.info("#doPost - Done")}
    if(authenticated){
      req?.getRequestDispatcher("../sso-response.jsp")?.include(req, resp)
    }else{
      req.setAttribute("ErrorMessage", "The username/password submitted is invalid")
      req.setAttribute(SAML.RELAYSTATE, req.getParameter(SAML.RELAYSTATE))
      req.setAttribute(SAML.REQUEST, req.getParameter(SAML.REQUEST))

      WebRequestInfo.Util.setNoCacheHeader(resp)
      req?.getRequestDispatcher("../sso-login.jsp")?.include(req, resp)
    }
  }

  protected function samlAuthenticate(reqParams: SAMLRequestParameters) : Boolean {
    if(gw.api.system.server.ServerModeUtil.isDev()) {logger.info("#samlAuthenticate - enter")}
    var authenticated:Boolean = Boolean.FALSE
    var lSession:String = null

    try {
      if(gw.api.system.server.ServerModeUtil.isDev()) {logger.info("#samlAuthenticate - before call")}
      if(reqParams?.Username?.NotBlank) {
        lSession = LoginAPIHelper.login( reqParams.Username, reqParams.Password )
        if(lSession?.NotBlank) {
          authenticated = Boolean.TRUE
          logger.info("Authenticated " + reqParams.Username + " for IdP login")
        }
      } else {
        logger.info("#samlAuthenticate - bad username")
      }
    } catch (e : Throwable) {
      logger.error("Error with login", e)
      authenticated = Boolean.FALSE
    } finally {
      if(lSession?.NotBlank) {
        if(gw.api.system.server.ServerModeUtil.isDev()) {logger.info("#samlAuthenticate - User authenticated, closing session")}
        LoginAPIHelper.logout(lSession)
      } else {
        logger.info("#doPost - core session is null")
      }
      reqParams.Password = null
    }
    if(gw.api.system.server.ServerModeUtil.isDev()) {logger.info("#samlAuthenticate - after calls,  status: " + authenticated)}
    return authenticated
  }

  override function isAuthenticationRequired(req: HttpServletRequest): boolean {
    return false // authentication done differently
  }

  override function authenticate(req: HttpServletRequest): String {
    return "demo"
  }

  override function storeToken(req: HttpServletRequest, token: String) {
  }

  override function invalidAuthentication(req: HttpServletRequest, resp: HttpServletResponse) {
  }
}
