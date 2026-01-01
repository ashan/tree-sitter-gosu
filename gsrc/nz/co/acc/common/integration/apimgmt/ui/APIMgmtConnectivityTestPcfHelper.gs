package nz.co.acc.common.integration.apimgmt.ui

uses nz.co.acc.common.integration.apimgmt.transport.APIMgmtClient
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.client.utils.URIBuilder

uses java.net.URI

/**
 * Helper class for the API Management Connectivity Tester UI.
 * <p>
 * Created by Kaushalya Samarasekera
 */
class APIMgmtConnectivityTestPcfHelper {
  var _status: Status as readonly Status = new Status()

  /**
   * Returns the URL used for the test.
   *
   * @return
   */
  function getConnUrl(): String {
    return getUri().toString()
  }

  /**
   * Establish a new connection to the API Management endpoint.
   */
  function testConnectivity() {
    try {
      APIMgmtClient.Instance.send(getUri(), null, HttpGet.METHOD_NAME)
      _status.IsSuccessful = true
      _status.Output = null
    } catch (e: Exception) {
      _status._success = false
      _status._output = e.getMessage()
    }
    _status.Timestamp = new Date()
  }

  /**
   * Returns the base URL of the API management endpoint.
   *
   * @return url to use for the test
   */
  private function getUri(): URI {
    return new URIBuilder(ConfigurationProperty.API_MGMT_URL_BASE.PropertyValue).build()
  }

  class Status {
    var _success: Boolean as IsSuccessful
    var _output: String as Output
    var _timestamp: Date as Timestamp
  }
}
