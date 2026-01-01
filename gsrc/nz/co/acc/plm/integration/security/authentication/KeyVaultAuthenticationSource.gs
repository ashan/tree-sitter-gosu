package nz.co.acc.plm.integration.security.authentication

uses com.guidewire.pl.system.dependency.PLDependencies
uses edge.util.helper.UserUtil
uses gw.plugin.security.AuthenticationSource

/**
 * Authentication source class for KeyVault authentication.
 * <p>
 * <strong>Usage</strong>:
 * <p>
 * To use this source for KeyVault authentication:
 * <ol>
 * <li>Initiate using constructor passing user name and password.</li>
 * <li>Credentials are authenticated in constructor.</li>
 * <li>KeyVaultAzureAPI can be used for using the authenticated credentials or authentication result.</li>
 * </ol>
 * </p>
 * Created by nitesh.gautam on 26/10/2017.
 */
class KeyVaultAuthenticationSource implements AuthenticationSource {
  private var _userName: String as Username = null
  private var _pid: String as PublicID = null
  private var _password: String as Password = null
  private var _user: User as User = null
  private var _authenticated: Boolean as isAuthenticated = Boolean.FALSE
  private var _errorMessage: String as ErrorMessage = ""

  public construct() {
  }

  public construct(userName: String, password: String) {
    var api = new KeyVaultAzureAPI()
    try {
      if (api.isUserInAuthList(userName)) {
        this._userName = userName
      }
      if (api.confirmCredentials(userName, password)) {
        this._password = password
      }
    } catch (e: KeyVaultException) {
      this._errorMessage = e.getMessage()
    }

    this._user = PLDependencies.getUserFinder().findByCredentialName(this._userName)
    this._pid = this._user?.PublicID
    if (this._pid != null) {
      this._authenticated = Boolean.TRUE
    }
  }

  override property get Hash(): char[] {
    return this._password.toCharArray()
  }

  override function determineSourceComplete(): boolean {
    return true
  }

}