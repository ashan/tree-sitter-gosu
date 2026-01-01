package nz.co.acc.plm.integration.security.authentication

uses com.microsoft.aad.msal4j.AuthorizationCodeParameters
uses com.microsoft.aad.msal4j.ClientCredentialFactory
uses com.microsoft.aad.msal4j.ConfidentialClientApplication
uses com.microsoft.aad.msal4j.IAuthenticationResult
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.configurationservice.SecurePropertyLoader
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses org.apache.http.HttpStatus
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.impl.client.CloseableHttpClient
uses org.apache.http.impl.client.HttpClients
uses org.apache.http.util.EntityUtils
uses org.json.simple.JSONObject
uses org.json.simple.parser.JSONParser

uses java.net.SocketException
uses java.net.URI
uses java.util.concurrent.ExecutorService
uses java.util.concurrent.Executors

/**
 * Created by fabianr on 28/02/2017.
 */
class OAuthAzure2API implements IOAuth2API {

  var log = StructuredLogger.INTEGRATION.withClass(this)
  public static var ERROR_GETTING_ACCESS_TOKEN: String = "Error getting access token"
  public static var ERROR_FAILED_TO_GET_USER_PRINCIPAL: String = "Failed to the get the user principal"
  public static var ERROR_PERMISSION_DENIED: String = "Permission denied to access this application"
  public static var ERROR_OAUTH_SERVER_NOT_AVAILABLE: String = "Authentication server is not available"
  public static var ERROR_ACCESS_DENIED: String = "access_denied"
  public static var ERROR_UNEXPECTED: String = "Unexpected Error"

  var graphUrl = ConfigurationProperty.AZURE_AD_GRAPH_URL.PropertyValue
  var grapAPIVersion = ConfigurationProperty.AZURE_AD_GRAPH_VERSION.PropertyValue
  var tenant = ConfigurationProperty.APP_TENANT_ID.PropertyValue
  var redirectUri = ConfigurationProperty.APP_REDIRECT_URL.PropertyValue
  var authority = ConfigurationProperty.AZURE_AD_AUTHORITY_URL.PropertyValue
  var clientId = ConfigurationProperty.APP_CLIENT_ID.PropertyValue
  var clientSecret = SecurePropertyLoader.Instance.getConfigurationAppSecret()

  private final var confClientInstance : ConfidentialClientApplication

  construct() {
    var credential = ClientCredentialFactory.createFromSecret(clientSecret)
    this.confClientInstance = ConfidentialClientApplication
        .builder(clientId, credential)
        .authority(authority + tenant + "/")
        .build()
  }


  public static function isEnabled(): Boolean {
    return (ScriptParameters.getParameterValue("OAuthExternalAuthenticationEnabled_ACC") as Boolean)
  }

  public static function getHomePageURL(): String {
    return ConfigurationProperty.EXTERNAL_AUTHENTICATION_HOMPAGE_URL.PropertyValue
  }

  override function getAccessToken(accessCode: String): String {
    var result: IAuthenticationResult = null
    var scopes = Collections.singleton(graphUrl +"/.default")
    var authParameters = AuthorizationCodeParameters
        .builder(accessCode, new URI(redirectUri))
        .scopes(scopes)
        .build()
    log.info("Acquiring access token.")
    try {
      var future = confClientInstance.acquireToken(authParameters)
      result = future.get()
    } catch (e: Exception) {
      log.error_ACC("Failed to acquire access token ", e)
      throw new OAuth2Exception(ERROR_OAUTH_SERVER_NOT_AVAILABLE)
    }

    var accessToken: String = null
    if (result == null) {
      log.error_ACC("Failed to acquire access token")
      throw new OAuth2Exception(ERROR_GETTING_ACCESS_TOKEN)
    } else {
      accessToken = result.accessToken()
    }
    return accessToken
  }

  override function getUserPrincipal(accessToken: String): String {
    var method = "getUserPrincipal()"
    var principal: String
    var httpClient: CloseableHttpClient
    httpClient = HttpClients.createDefault();
    var httpGet = new HttpGet(graphUrl + tenant + "/me?api-version=" + grapAPIVersion)
    httpGet.addHeader("api-version", grapAPIVersion)
    httpGet.addHeader("Authorization", accessToken)
    httpGet.addHeader("Accept", "application/json;odata=minimalmetadata")
    try {
      var response = httpClient.execute(httpGet);
      if (response.getStatusLine().StatusCode == HttpStatus.SC_OK) {
        var result = EntityUtils.toString(response.getEntity())
        StructuredLogger.INTEGRATION.debug(this + " " + method + " " + "AccessToken : ${result}")
        principal = parsePrincipal(result)
      } else if (response.getStatusLine().StatusCode == HttpStatus.SC_FORBIDDEN
          || response.getStatusLine().StatusCode == HttpStatus.SC_BAD_REQUEST) {
        StructuredLogger.INTEGRATION.error_ACC(this + " " + method + " " +
            ERROR_PERMISSION_DENIED + response.toString())
        throw new OAuth2Exception(ERROR_PERMISSION_DENIED)
      } else {
        StructuredLogger.INTEGRATION.error_ACC(this + " " + method + " " + ERROR_UNEXPECTED + response.toString())
        throw new OAuth2Exception(ERROR_UNEXPECTED)
      }
    } catch (e: SocketException) {
      StructuredLogger.INTEGRATION.error_ACC(this + " " + method + " " +
          ERROR_OAUTH_SERVER_NOT_AVAILABLE + e.getCause())
      throw new OAuth2Exception(ERROR_OAUTH_SERVER_NOT_AVAILABLE)
    } catch (e: Exception) {
      StructuredLogger.INTEGRATION.error_ACC(this + " " + method + " " +
          ERROR_UNEXPECTED + e.getCause())
      throw new OAuth2Exception(ERROR_UNEXPECTED)
    } finally {
      httpClient.close()
    }
    return principal
  }

  private function parsePrincipal(jsonString: String): String {
    var method = "parsePrincipal()"
    try {
      var parser = new JSONParser();
      var obj = parser.parse(jsonString)
      var jsonObject = obj as JSONObject
      var principalName = jsonObject.get("userPrincipalName") as String
      return principalName.substring(0, principalName.indexOf("@"))
    } catch (e: Exception) {
      StructuredLogger.INTEGRATION.error_ACC( this + " " + method + " " +
          ERROR_FAILED_TO_GET_USER_PRINCIPAL + e.getCause())
      throw new OAuth2Exception(ERROR_FAILED_TO_GET_USER_PRINCIPAL)
    }
  }


}