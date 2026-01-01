package nz.co.acc.common.integration.security

uses com.microsoft.aad.msal4j.ClientCredentialFactory
uses com.microsoft.aad.msal4j.ClientCredentialParameters
uses com.microsoft.aad.msal4j.ConfidentialClientApplication
uses com.microsoft.aad.msal4j.IAuthenticationResult
uses com.microsoft.aad.msal4j.IClientCredential
uses com.microsoft.aad.msal4j.IntegratedWindowsAuthenticationParameters
uses com.microsoft.aad.msal4j.InteractiveRequestParameters
uses com.microsoft.aad.msal4j.MsalException
uses com.microsoft.aad.msal4j.PublicClientApplication
uses com.microsoft.aad.msal4j.SilentParameters
uses gw.api.system.server.ServerModeUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.configurationservice.SecurePropertyLoader
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses org.apache.commons.io.IOUtils
uses org.json.simple.JSONObject
uses org.json.simple.parser.JSONParser

uses javax.imageio.IIOException
uses javax.naming.ServiceUnavailableException
uses javax.net.ssl.HttpsURLConnection
uses java.io.IOException
uses java.net.URI
uses java.net.URL
uses java.net.UnknownHostException
uses java.util.concurrent.ExecutorService
uses java.util.concurrent.Executors


/**
 * Loads KeyVault API configuration.
 * <p>
 * <strong>Usage</strong>:
 * <p>
 * To use this authentication:
 * <ol>
 * <li>Add basic authentication parameters in configuration.properties.</li>
 * <li>call getSecret to verify API credentials.</li>
 * </ol>
 * </p>
 * Created by fabianr on 11/01/2017.
 */
class ACCKeyVaultAPI {
  private static var _log = StructuredLogger.INTEGRATION_FILE.withClass(ACCKeyVaultAPI)
  var _applicationId: String as ApplicationId
  var _applicationSecret: String as ApplicationSecret
  var _confidentialClientApplication: ConfidentialClientApplication
  construct() {
    this._applicationId = ConfigurationProperty.VAULT_CLIENT_ID.PropertyValue
    this._applicationSecret = SecurePropertyLoader.Instance.getConfigurationKeyVaulAppSecret()
    var credential = ClientCredentialFactory.createFromSecret(this._applicationSecret)
    this._confidentialClientApplication =
        ConfidentialClientApplication
            .builder(this._applicationId, credential)
            .authority(getAuthorisationURL())
            .build()
  }

  public function getSecret(secret: String, vaultName: String, accessToken: String = null): String {
    if (accessToken == null) {
      accessToken = this.getAccessToken()
    }
    var response: String = null
    try {
      var urlString = "https://${vaultName}.${ConfigurationProperty.VAULT_URI.PropertyValue}/secrets/${secret}?api-version=${ConfigurationProperty.VAULT_API_VERSION.PropertyValue}"
      var conn = (HttpsURLConnection)(new URL(urlString).openConnection())
      conn.setRequestProperty("Authorization", "Bearer ${accessToken}")
      response = IOUtils.toString(conn.getInputStream())
    } catch (e: UnknownHostException){
      if(ServerModeUtil.isDev()){
        _log.warn_ACC("Error getting secret ${secret} due to UnknownHostException " + e.getMessage())
      }else{
        _log.error_ACC("Error getting secret ${secret}", e)
      }
    } catch (e: IOException) {
      if(ServerModeUtil.isDev()){
        _log.warn_ACC("Error getting secret ${secret} due to IOException " + e.getMessage())
      }else{
        _log.error_ACC("Error getting secret ${secret}", e)
      }
    } catch (e: Exception) {
      _log.error_ACC("Error getting secret ${secret}", e)
    }

    return response != null ? getValue(response) : response
  }

  private function getValue(json: String): String {
    var parser = new JSONParser()
    var obj = parser.parse(json)
    var jsonObject = obj as JSONObject
    return jsonObject.get("value").toString()
  }

  public function getAccessToken(): String {
    var vaultResourceUrl = "https://${ConfigurationProperty.VAULT_URI.PropertyValue}/.default"
    var authorizationUrl = getAuthorisationURL()
    var SCOPE: Set<String> = Collections.singleton(vaultResourceUrl)
    _log.info("Getting access token for vaultResourceURl ${vaultResourceUrl}")

    var result: IAuthenticationResult = null
    var parameters = ClientCredentialParameters
        .builder(SCOPE)
        .build()

    result = this._confidentialClientApplication.acquireToken(parameters).join()
    return result.accessToken()
  }

  function getAuthorisationURL(): String {
    return "https://${ConfigurationProperty.VAULT_AUTHORIZATION_DOMAIN.PropertyValue}/${ConfigurationProperty.VAULT_TENANT_ID.PropertyValue}"
  }


}