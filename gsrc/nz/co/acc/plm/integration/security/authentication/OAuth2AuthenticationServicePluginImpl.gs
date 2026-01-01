package nz.co.acc.plm.integration.security.authentication

uses gw.api.locale.DisplayKey
uses gw.pl.exception.GWConfigurationException
uses gw.plugin.security.AuthenticationServicePlugin
uses gw.plugin.security.AuthenticationServicePluginCallbackHandler
uses gw.plugin.security.AuthenticationSource
uses gw.plugin.security.CredentialVerificationResult
uses gw.plugin.security.LockedCredentialException
uses gw.plugin.security.MustWaitToRetryException
uses gw.plugin.security.UserNamePasswordAuthenticationSource
uses gw.surepath.suite.integration.logging.StructuredLogger

uses gw.surepath.suite.integration.logging.StructuredLogger

uses javax.security.auth.login.FailedLoginException

/**
 * Created by fabianr on 24/02/2017.
 */
class OAuth2AuthenticationServicePluginImpl implements AuthenticationServicePlugin {

  private var _handler: AuthenticationServicePluginCallbackHandler = null

  override function authenticate(source: AuthenticationSource): String {
    var publicId: String = null  // Default authorization is false
    if (this._handler == null) {
      throw new GWConfigurationException("Unable to authenticate, callback handler is currently null")
    }
    if (source typeis OAuth2AuthenticationSource) {
      publicId = oAuth2Authentication(source as OAuth2AuthenticationSource)
    } else if (source typeis UserNamePasswordAuthenticationSource) {
      publicId = userNamePasswordAuthenticationSource(source as UserNamePasswordAuthenticationSource)
    }
    return publicId
  }

  private function oAuth2Authentication(authSource: OAuth2AuthenticationSource): String {
    var method = "oAuth2Authentication()"
    var publicId: String = null
    // has error
    if (!authSource.ErrorMessage.isEmpty()) {
      // Can add more add messsage to handle error
      if (authSource.ErrorMessage == OAuthAzure2API.ERROR_OAUTH_SERVER_NOT_AVAILABLE) {
        throw new FailedLoginException(DisplayKey.get("ext.Authentication.AzureAD.NotAvailable_ACC"))
      } else if (authSource.ErrorMessage == OAuthAzure2API.ERROR_PERMISSION_DENIED) {
        throw new FailedLoginException(DisplayKey.get("ext.Authentication.AzureAD.PermissionDenied_ACC"))
      } else if (authSource.ErrorMessage == OAuthAzure2API.ERROR_ACCESS_DENIED) {
        throw new FailedLoginException(DisplayKey.get("ext.Authentication.AzureAD.AccessDenied_ACC"))
      } else
        throw new FailedLoginException(DisplayKey.get("ext.Authentication.AzureAD.UnexpectedError_ACC"))
    }
    if (authSource.isAuthenticated) {
      StructuredLogger.INTEGRATION.info(this + " " + method + " " + "User: " + authSource.Username + " is authenticated via OAuth2")
      publicId = authSource.PublicID
    } else {
      StructuredLogger.INTEGRATION.error_ACC( this + " " + method + " " + "Cannot Find the User :" + authSource.Username + " in Guidewire")
      throw new FailedLoginException(DisplayKey.get("ext.Authentication.AzureAD.UserNotFound_ACC", authSource.Username))
    }
    return publicId
  }

  private function userNamePasswordAuthenticationSource(authSource: UserNamePasswordAuthenticationSource): String {
    var publicId: String = null
    var username = authSource.Username
    publicId = this._handler.findUser(username)
    if (publicId == null) {
      throw new FailedLoginException("Bad user name " + username);
    }
    var returnCode = _handler.verifyInternalCredential(publicId, authSource.getPassword());
    // Default Error Codes
    if (returnCode == CredentialVerificationResult.BAD_USER_ID) {
      throw new FailedLoginException("Bad user name " + username);
    } else if (returnCode == CredentialVerificationResult.WAIT_TO_RETRY) {
      throw new MustWaitToRetryException("Still within the login retry delay period");
    } else if (returnCode == CredentialVerificationResult.CREDENTIAL_LOCKED) {
      throw new LockedCredentialException("The specified account has been locked");
    } else if (returnCode == CredentialVerificationResult.PASSWORD_MISMATCH) {
      throw new FailedLoginException("Bad password for user " + username);
    }
    return publicId
  }


  override property set Callback(callbackHandler : AuthenticationServicePluginCallbackHandler) {
    this._handler = callbackHandler
  }
}