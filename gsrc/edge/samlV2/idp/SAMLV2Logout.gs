package edge.samlV2.idp
uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse
uses gw.servlet.Servlet
uses javax.servlet.http.HttpServlet
uses gw.api.util.Logger
uses edge.PlatformSupport.TranslateUtil

@Servlet("/ssologout")
class SAMLV2Logout extends HttpServlet {

  /**
   * Class level logger used for ongoing log messaging,  and debug/trace logging
   */
  public static final var logger:org.slf4j.Logger = Logger.forCategory(SAMLV2Logout.Type.DisplayName)

  construct() {

  }

  override public function doGet(request:HttpServletRequest, response:HttpServletResponse) {
    SAMLV2Logout.logger.info("#doGET - Enter")

    response.setContentType("text/html")
    response.setCharacterEncoding("UTF-8")

    for(cookie in request.Cookies) {
      if(cookie.Name != null && cookie.Name.equalsIgnoreCase("JSESSIONID-8180")){
        if(SAMLImpl.SESSION_COOKIE_DOMAIN != null && SAMLImpl.SESSION_COOKIE_DOMAIN.trim().HasContent){
          cookie.setDomain(SAMLImpl.SESSION_COOKIE_DOMAIN)
        }
        cookie.setValue(null)
        cookie.setMaxAge(0)
        cookie.setPath(SAMLImpl.SESSION_COOKIE_PATH)
        response.addCookie(cookie)
        SAMLV2Logout.logger.info("[GET] Removed PC session cookie.")
      }
    }

    request.setAttribute(SAML.RELAYSTATE, request.getParameter(SAML.RELAYSTATE))
    request.setAttribute(SAML.REQUEST, request.getParameter(SAML.REQUEST))
    request.setAttribute("logoutMessage", TranslateUtil.translate("Edge.Web.logoutMessage", { "/agent-portal/app/html/index.html" }))

    request?.getRequestDispatcher("../logged-off.jsp")?.include(request, response)
    SAMLV2Logout.logger.info("#doGET - Leave")
  }

  override public function doPost(request: HttpServletRequest, response: HttpServletResponse) {
    SAMLV2Logout.logger.info("#doPOST - Enter")

    SAMLV2Logout.logger.info("#doPOST - Leave")
  }
}
