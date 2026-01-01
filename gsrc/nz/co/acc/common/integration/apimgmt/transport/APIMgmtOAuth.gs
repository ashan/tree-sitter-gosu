package nz.co.acc.common.integration.apimgmt.transport

uses com.microsoft.aad.msal4j.ClientCredentialFactory
uses com.microsoft.aad.msal4j.ClientCredentialParameters
uses com.microsoft.aad.msal4j.ConfidentialClientApplication
uses com.microsoft.aad.msal4j.IAuthenticationResult
uses com.microsoft.aad.msal4j.IntegratedWindowsAuthenticationParameters
uses com.microsoft.aad.msal4j.InteractiveRequestParameters
uses com.microsoft.aad.msal4j.PublicClientApplication
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.GosuStringUtil
uses nz.co.acc.common.integration.apimgmt.exceptions.APIMgmtException
uses nz.co.acc.common.integration.security.OAuthToken
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty


uses java.net.URI
uses java.time.Instant
uses java.time.ZoneId
uses java.util.concurrent.ExecutorService
uses java.util.concurrent.Executors
uses java.util.concurrent.locks.ReentrantLock

/**
 * Singleton service to acquire and cache access token for GW to API Management request authorisation.
 *
 * @author Kaushalya Samarasekera
 */
class APIMgmtOAuth {
  var _applicationId = ConfigurationProperty.API_MGMT_OAUTH2_CLIENTID.PropertyValue
  var credential = ClientCredentialFactory.createFromSecret(ConfigurationProperty.API_MGMT_OAUTH2_CLIENTSECRET.PropertyValue)
  var authorizationUrl ="${ConfigurationProperty.API_MGMT_OAUTH2_AUTH_URI_BASE.PropertyValue}/${ConfigurationProperty.API_MGMT_OAUTH2_TENANTID.PropertyValue}/oauth2/token"

  var _confidentialClientApplication = ConfidentialClientApplication
      .builder(this._applicationId, credential)
      .authority(authorizationUrl)
      .build()

  private static var _log = StructuredLogger.INTEGRATION.withClass(APIMgmtOAuth)
  /**
   * Singleton instance
   */
  static var _instance: APIMgmtOAuth as readonly Instance = new APIMgmtOAuth()
  var _accessToken = new OAuthToken(null, null)
  var _lock = new ReentrantLock()

  /**
   * Returns a valid access token.
   *
   * @return access token.
   */
  function getAccessToken(): String {
    if (!Boolean.valueOf(ConfigurationProperty.API_MGMT_URL_ENABLED.PropertyValue)) {
      return GosuStringUtil.EMPTY
    }

    if (not _accessToken.isValid()) {
      // Lock it so only one thread does authentication, a single access token to be used for the whole application.
      using (_lock) {
        if (not _accessToken.isValid()) {
          _accessToken = acquireToken()
        }
      }
    }
    return _accessToken.Token
  }

  /**
   * Acquire access token by talking to the authentication service
   *
   * @return oauth access token
   */
  private function acquireToken(): OAuthToken {
    var result: IAuthenticationResult = null
    try {
      var resourceUrl = ConfigurationProperty.API_MGMT_OAUTH2_RESOURCE_URI.PropertyValue+"/.default"
      var SCOPE: Set<String> = Collections.singleton(resourceUrl)
      _log.info("Getting access token for resource url  ${resourceUrl}")
      var parameters = ClientCredentialParameters
          .builder(SCOPE)
          .build()
      result = this._confidentialClientApplication.acquireToken(parameters).join()
    } catch (e: Exception) {
      _log.error_ACC("Cant aquire token", e)
      throw new APIMgmtException("api management oauth2 authentication failed.", e)
    }
    if (result == null) {
      throw new APIMgmtException("api management oauth2 authentication returned void.")

    } else {
      _log.info("acquired token successfully.")
      var accessTokenExpiresAt = result.expiresOnDate()
      return new OAuthToken(result.accessToken(), accessTokenExpiresAt)
    }
  }

  /**
   * Returns the result as a string for logging purposes.
   *
   * @param result authentication result from the authorisation service
   * @return values as a string
   */
  private function getResultAsString(result: IAuthenticationResult): String {
    var accessToken = result.accessToken()
    var expiresOn = result.expiresOnDate()
    return "accessToken=${accessToken}, expiresOn=${expiresOn}"
  }
}

