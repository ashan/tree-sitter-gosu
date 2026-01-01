package nz.co.acc.plm.integration.security.authentication

uses com.guidewire.pl.system.dependency.PLDependencies
uses gw.plugin.security.AuthenticationSource

/**
 * Created by fabianr on 24/02/2017.
 */
class OAuth2AuthenticationSource implements AuthenticationSource {
  private var _user: String as Username = null
  private var _pid: String as PublicID = null
  private var _authenticated: Boolean as isAuthenticated = Boolean.FALSE
  private var _token: String = null
  private var _errorMessage: String as ErrorMessage = ""

  public construct() {
  }

  public construct(accessCode: String) {
    var api = new OAuthAzure2API()
    try {
      this._token = api.getAccessToken(accessCode)
      this._user = api.getUserPrincipal(this._token)
    } catch (e: OAuth2Exception) {
      this._errorMessage = e.getMessage()
    }
    this._pid = PLDependencies.getUserFinder().findByCredentialName(this._user).PublicID

    if (this._pid != null) {
      this._authenticated = Boolean.TRUE
    }
  }

  override property get Hash(): char[] {
    return this._token.toCharArray()
  }

  override function determineSourceComplete(): boolean {
    return true
  }

}