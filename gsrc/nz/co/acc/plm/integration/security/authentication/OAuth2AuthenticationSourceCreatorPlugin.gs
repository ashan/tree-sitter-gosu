package nz.co.acc.plm.integration.security.authentication

uses gw.plugin.security.AuthenticationSource
uses gw.plugin.security.AuthenticationSourceCreatorPlugin
uses gw.plugin.security.UserNamePasswordAuthenticationSource

uses javax.servlet.http.HttpServletRequest

/**
 * Created by fabianr on 20/02/2017.
 */

class OAuth2AuthenticationSourceCreatorPlugin implements AuthenticationSourceCreatorPlugin {


  override function createSourceFromHTTPRequest(request: HttpServletRequest): AuthenticationSource {

    var source: AuthenticationSource
    var code = request.getParameter("code")
    var error = request.getParameter("error")
    if (code != null) {
      source = new OAuth2AuthenticationSource(code)
    } else if (error != null) {
      var oAuth2AuthenticationSource = new OAuth2AuthenticationSource()
      oAuth2AuthenticationSource.ErrorMessage = request.getParameter("error")
      source = oAuth2AuthenticationSource
    } else {
      var userName = request.getAttribute("username") as String;
      var password = request.getAttribute("password") as String;
      return new UserNamePasswordAuthenticationSource(userName, password);
    }
    return source
  }

}


