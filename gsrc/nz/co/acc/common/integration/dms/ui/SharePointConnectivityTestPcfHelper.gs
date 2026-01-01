package nz.co.acc.common.integration.dms.ui

uses nz.co.acc.common.integration.apimgmt.transport.APIMgmtClient
uses nz.co.acc.common.integration.dms.DocumentNotFoundException
uses nz.co.acc.common.integration.dms.DocumentStoreException
uses nz.co.acc.common.integration.dms.SPOAuthProperties
uses nz.co.acc.common.integration.dms.SharepointAPI
uses nz.co.acc.common.integration.security.OAuthAPI
uses nz.co.acc.common.integration.security.OAuthProperties
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.client.utils.URIBuilder

uses java.io.PrintWriter
uses java.io.StringWriter
uses java.net.URI

/**
 * Helper class for the SharePoint Connectivity Tester UI.
 * <p>
 * Created by Nick Mei on 06/09/2017.
 */
class SharePointConnectivityTestPcfHelper {
  var _status: Status as readonly Status = new Status()

  class Status {
    var _success: Boolean as IsSuccessful
    var _output: String as Output
    var _timestamp: Date as Timestamp
  }

  function getAuthorisationUrl(): String {
    return new SharepointAPI().getAuthorisationUrl(new SPOAuthProperties())
  }

  /**
   * Returns the Site Collection URL used for the test.
   *
   * @return
   */
  function getResourceUri(): String {
    return ConfigurationProperty.DMS_SHAREPOINT_SITE_COLLECTION_API_URL.PropertyValue
  }

  /**
   * Establish a new connection to the SharePoint endpoint.
   */
  function testConnectivity() {
    try {
      var spAPI = new SharepointAPI()
      try {
        spAPI.getDocumentFileContent("THIS-IS-A-CONNECTIVITY-TEST")
      } catch (e:DocumentStoreException) {
        // This is what we are expecting. Anything else is a fail.
        if (!e.getMessage().contains("Guid should contain 32 digits with 4 dashes")) {
          throw e
        }
      }
      _status.Output = null
      _status.IsSuccessful = true
    } catch (e: Exception) {
      _status._success = false

      var stackTrace = new StringWriter();
      e.printStackTrace(new PrintWriter(stackTrace))
      _status._output = stackTrace.toString()
    }
    _status.Timestamp = new Date()
  }

  function isConnectivityEnabled() : boolean {
    return getAuthorisationUrl()?.NotBlank and getResourceUri()?.NotBlank
  }
}
