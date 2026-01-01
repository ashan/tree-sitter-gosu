package edge.samlV2.authplugins

uses gw.plugin.security.AuthenticationSourceCreatorPlugin
uses gw.plugin.security.AuthenticationSource
uses javax.servlet.http.HttpServletRequest
uses gw.plugin.security.UserNamePasswordAuthenticationSource

/**
 * An authentication source creation plugin that determins if there is a SAMLResponse header present or not
 * - Yes: Attempt to create a SAMLAuthenticationSource object with the assertion
 * - No : Return a normal username/password authentication source object
 *
 * @author bdubroy
 */
class SAMLAuthenticationSourceCreatorPlugin implements AuthenticationSourceCreatorPlugin {
  override function createSourceFromHTTPRequest(req: HttpServletRequest): AuthenticationSource {
    var samlresponse = req.getHeader("samlresponse")

    if(samlresponse?.NotBlank) {// If we have a samlresponse session present on the request,
      return new SAMLAuthenticationSource(samlresponse)
    } else {
      var userName = req.getAttribute("username") as String;
      var password = req.getAttribute("password") as String;
      return new UserNamePasswordAuthenticationSource(userName, password);
    }
  }
}
