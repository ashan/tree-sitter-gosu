package nz.co.acc.common.integration.security

uses com.microsoft.aad.msal4j.ClientCredentialParameters
uses com.microsoft.aad.msal4j.IAuthenticationResult
uses com.microsoft.aad.msal4j.IntegratedWindowsAuthenticationParameters
uses com.microsoft.aad.msal4j.PublicClientApplication
uses com.microsoft.aad.msal4j.SilentParameters
uses com.microsoft.aad.msal4j.UserNamePasswordParameters
uses gw.api.util.DateUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.http.HttpHeaders
uses org.apache.http.HttpStatus
uses org.apache.http.client.methods.HttpPost
uses org.apache.http.entity.StringEntity
uses org.apache.http.impl.client.HttpClientBuilder
uses org.apache.http.util.EntityUtils
uses org.json.simple.JSONObject
uses org.json.simple.JSONValue

uses java.net.URI
uses java.util.concurrent.ExecutorService
uses java.util.concurrent.Executors
uses java.util.concurrent.locks.ReentrantLock

/**
 * API implementation using OAuth mechanism.
 * <p>
 * Created by Nick Mei on 3/02/2017.
 */
class OAuthAPI {
  private static var _log = StructuredLogger.INTEGRATION.withClass(OAuthAPI)
  /**
   * All Concrete classes of this API should use this call, apiCheckpoint(), before doing any work.
   * This ensure we have a valid AccessToken before we can do real API calls.
   *
   * @param lockObject          - So that only one thread can be performing authentication at any time.
   * @param existingOAuthResult - Contains existing authenticated token information, like access token, and whether they are still valid.
   * @return
   * @Throws(OAuthException, "Something went wrong performing OAuth.")
   */
  function apiCheckpoint(lockObject: ReentrantLock, existingOAuthResult: OAuthResult, prop: OAuthProperties) {
    var funcName = "apiCheckpoint"
    if (not existingOAuthResult.isAccessTokenValid()) {
      // Lock it so only one thread does authentication, a single access token to be used for the whole application.
      using (lockObject) {
        if (not existingOAuthResult.isAccessTokenValid()) {
          var authenticated = false
          // Is Refresh Token supported for OAuth authentication
          if (existingOAuthResult.isRefreshTokenSupported() and existingOAuthResult.isRefreshTokenValid()) {
            try {
              existingOAuthResult.update(authenticate(existingOAuthResult.RefreshToken.Token, prop))
              _log.info("The OAuth by RefreshToken is successful for the ${prop.ResourceUri} new oauth result: ${existingOAuthResult.toString()}.")
              authenticated = true
            } catch (e: OAuthException) {
              // Something went wrong with the Refresh Token. Maybe it has expired?
              _log.warn_ACC("The OAuth by Refresh Token was not sucessful for the ${prop.ResourceUri}, existing oauth result: ${existingOAuthResult.toString()}.", e)
            }
          }

          if (not authenticated) {
            // New OAuth authentication
            existingOAuthResult.update(authenticate(prop))
            _log.info("The OAuth by authenication is successful for the ${prop.ResourceUri} new oauth result: ${existingOAuthResult.toString()}.")
          }
        }
      }
    }
  }

  /**
   * Authenticate with ResourceOwnerPasswordCredentialsGrant.
   * Reference: https://tools.ietf.org/html/rfc6749#section-5.1
   *
   * @throws OAuthException - when it fails.
   */
  public function authenticate(prop: OAuthProperties): OAuthResult {
    var funcName = "authenticate"
    try {
      // The Raw Request
      // POST https://login.windows.net/8506768f-a7d1-475b-901c-fc1c222f496a/oauth2/token
      // Accept: application/json;odata=verbose
      // Content-Type: application/x-www-form-urlencoded
      // resource=https%3A%2F%2Faccnz.sharepoint.com%2F&client_id=c790b169-94ac-42cf-a099-9300b4ff04a1&grant_type=password&username=<user_id>&password=<password>
      _log.info("Acquiring toke for resource ${prop.ResourceUri}")
      var authorizationUrl = getAuthorisationUrl(prop)
      var publicAuthApp = PublicClientApplication.builder(prop.ClientId).authority(authorizationUrl).build()
      var scopes: Set<String> = Collections.singleton(prop.ResourceUri + "/.default")
      var userNamePasswordParameters = UserNamePasswordParameters.builder(scopes, prop.Username, prop.Password.toCharArray()).build()
      var future = publicAuthApp.acquireToken(userNamePasswordParameters)
      var remoteAuthResult = future.get()
      var oauthResult = convertAuthResult(remoteAuthResult)
      return oauthResult
    } catch (e: Exception) {
      final var msg = "The OAuth for the ${prop.ResourceUri} failed."
      _log.error_ACC(msg, e)
      throw new OAuthException(msg, e)
    }
  }

  /**
   * Using the OAuth refresh token we use it to refresh the the whole OAuth Result and the access token along with it.
   *
   * @throws OAuthException - when it fails.
   */
  public function authenticate(refreshToken: String, prop: OAuthProperties): OAuthResult {
    // The Raw Request
    // POST https://login.windows.net/8506768f-a7d1-475b-901c-fc1c222f496a/oauth2/token
    // Accept: application/json;odata=verbose
    // Content-Type: application/x-www-form-urlencoded
    // grant_type=refresh_token&refresh_token=<refreshTokenValue>

    // IMPORTANT NOTE: The adal4j implementation does not support refresh token with username and password,
    // so we should use the adal4j to support clientSecret here.
    if (prop.ClientSecret?.NotBlank) {
      var service: ExecutorService = Executors.newFixedThreadPool(1)
      try {
        var authorizationUrl = getAuthorisationUrl(prop)
        var publicAuthApp = PublicClientApplication.builder(prop.ClientId).build()
        var scopes: Set<String> = Collections.singleton(prop.ResourceUri+"/.default")
        _log.info("Acquiring token silently for resource ${prop.ResourceUri}")
        var silentParams = SilentParameters.builder(scopes).build()
        var future = publicAuthApp.acquireTokenSilently(silentParams)
        var remoteAuthResult = future.get()
        var oauthResult = convertAuthResult(remoteAuthResult)
        return oauthResult
      } catch (e: Exception) {
        final var msg = "The OAuth for the ${prop.ResourceUri} failed."
        _log.error_ACC(msg, e)
        throw new OAuthException(msg, e)
      } finally {
        service.shutdown()
      }
    } else {
      // Alternatively, this is a bit crazy but try implement our own https call to support authenticating with just the refresh token,
      // which doesn't seem to require any username/password or clientid/clientsecret or anything else.
      var urlString = getAuthorisationUrl(prop)
      var request = new HttpPost(new URI(urlString))
      request.setHeader(HttpHeaders.ACCEPT, "application/json;odata=verbose")
      request.setHeader(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded")

      request.setEntity(new StringEntity("grant_type=refresh_token&refresh_token=${refreshToken}"))

      var client = HttpClientBuilder.create().build()
      var response = client.execute(request)
      var status = response.getStatusLine().getStatusCode()
      if (status == HttpStatus.SC_OK) {
        var responseBody = EntityUtils.toString(response.getEntity())
        var jsonObject = JSONValue.parse(responseBody) as JSONObject
        // convert respoonse to our OAuthResult object.
        var expires_in = jsonObject.get("expires_in") as int
        var accessTokenExpiresOn = DateUtil.currentDate().addSeconds(expires_in as int)
        var newAccessToken = new OAuthToken(jsonObject.get("access_token") as String, accessTokenExpiresOn)
        var newRefreshToken: OAuthToken = null
        var refreshTokenValue = jsonObject.get("refresh_token") as String
        if (refreshTokenValue != null) {
          newRefreshToken = new OAuthToken(refreshTokenValue, null)
        }
        return new OAuthResult(newAccessToken, newRefreshToken)
      } else {
        // Unexpected status code.
        final var msg = "The OAuth with refresh token failed, for the ${prop.ResourceUri} failed. The HTTP Status=${HttpStatus.SC_OK} responseBody=${EntityUtils.toString(response.getEntity())}"
        throw new OAuthException(msg)
      }
    }
  }


  /**
   * Converts MS AuthenticationResult object to our GW OAuth API AuthResult object.
   *
   * @param remoteAuthResult
   * @return
   */
  private function convertAuthResult(remoteAuthResult: IAuthenticationResult): OAuthResult {
    var accessTokenExpiresOn = remoteAuthResult.expiresOnDate()
    var newAccessToken = new OAuthToken(remoteAuthResult.accessToken(), accessTokenExpiresOn)
    var newRefreshToken: OAuthToken = null
    if (remoteAuthResult.accessToken() != null) {
      newRefreshToken = new OAuthToken(remoteAuthResult.accessToken(),null)
    }
    return new OAuthResult(newAccessToken, newRefreshToken)
  }

  function getAuthorisationUrl(prop: OAuthProperties): String {
    return "https://${prop.AuthorisationDomain}/${prop.TenantId}/oauth2/token"
  }
}
