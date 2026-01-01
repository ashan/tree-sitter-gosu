package nz.co.acc.common.integration.apimgmt.transport

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.apimgmt.exceptions.APIMgmtException
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses org.apache.commons.io.IOUtils
uses org.apache.http.HttpHeaders
uses org.apache.http.HttpStatus
uses org.apache.http.client.config.RequestConfig
uses org.apache.http.client.methods.CloseableHttpResponse
uses org.apache.http.client.methods.HttpDelete
uses org.apache.http.client.methods.HttpEntityEnclosingRequestBase
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.client.methods.HttpPatch
uses org.apache.http.client.methods.HttpRequestBase
uses org.apache.http.entity.ContentType
uses org.apache.http.entity.StringEntity
uses org.apache.http.impl.client.CloseableHttpClient
uses org.apache.http.impl.client.HttpClients
uses org.apache.http.impl.conn.PoolingHttpClientConnectionManager
uses org.apache.http.util.EntityUtils

uses java.net.ConnectException
uses java.net.URI

/**
 * Http client to communicate with the API Management REST webservice endpoints.
 * Maintains a pool of http clients connections for improved throughput.
 */
class APIMgmtClient {
  private static var _log = StructuredLogger.INTEGRATION.withClass(APIMgmtClient)

  /**
   * Max. number of connections that will be kept in the pool.
   */
  static final var MAX_CONN_TOTAL = 100

  /**
   * Max. number of connections maintained per http route. Route is an http URI.
   */
  static final var MAX_CONN_PER_ROUTE = 10

  static var _instance: APIMgmtClient as readonly Instance = new APIMgmtClient()

  var _client: CloseableHttpClient

  private construct() {
    var cm = new PoolingHttpClientConnectionManager()

    //TODO - Better to move these config parameters to ConfigurationProperty so can externally configure
    cm.setMaxTotal(MAX_CONN_TOTAL)
    cm.setDefaultMaxPerRoute(MAX_CONN_PER_ROUTE)

    _client = HttpClients.custom().setConnectionManager(cm).build()
  }

  /**
   * Sends an http request to a given REST endpoint.
   *
   * @param endpointUri REST endpoint URI
   * @param jsonPayload JSON payload to include in the http body
   * @param verb        http verb to use for the REST request
   */
  @Throws(APIMgmtException, "If an unexpected or unsuccessful response received from the API Management.")
  @Throws(ConnectException, "If cannot reach API Management.")
  function send(endpointUri: URI, jsonPayload: String, verb: String = HttpPatch.METHOD_NAME) {
    var fn = "send"

    var request: HttpRequestBase

    switch (verb) {
      case HttpDelete.METHOD_NAME:
        request = new HttpDelete(endpointUri)
        break
      case HttpGet.METHOD_NAME:
        request = new HttpGet(endpointUri)
        break
      default:
        request = new HttpPatch(endpointUri)
        (request as HttpPatch).setEntity(new StringEntity(jsonPayload, ContentType.APPLICATION_JSON))
    }

    initRequestHeaders(request)

    var msg = "sending data to api management -> ${verb} ${endpointUri}"
    if (_log.DebugEnabled) {
      if (request typeis HttpEntityEnclosingRequestBase) {
        msg = "${msg}${System.lineSeparator()}${jsonPayload}"
      }
    }
    _log.info(msg)

    if (!Boolean.valueOf(ConfigurationProperty.API_MGMT_URL_ENABLED.PropertyValue)) {
      _log.warn_ACC("api management connectivity is DISABLED.")
      return
    }

    var response: CloseableHttpResponse

    try {
      response = _client.execute(request)

      var status = response.getStatusLine().getStatusCode()
      switch (status) {
        case HttpStatus.SC_ACCEPTED:
        case HttpStatus.SC_NO_CONTENT:
          _log.info("api management ack received for ${verb} ${endpointUri}, result=success, httpCode=${status}")
          break
        case HttpStatus.SC_BAD_REQUEST:
          // Note: Not throwing an exception here as bad requests should not be retried as per the agreement with API Management (Solnet).
          _log.error_ACC( "api management ack received for ${verb} ${endpointUri}, result=failed, httpCode=${status}, reason=invalid-request, responseBody=${IOUtils.toString(response.getEntity().getContent())}, requestBody=${jsonPayload}")
          break
        default:
          // Unexpected status code.
          throw new APIMgmtException("api management ack received for ${verb} ${endpointUri}, result=failed, httpCode=${status}, reason=unexpected-error, responseBody=${response.Entity == null ? '<empty>' : EntityUtils.toString(response.Entity)}")
      }
    } finally {
      // If the response has a paylaod, consume it fully to release the http connection back to the pool.
      EntityUtils.consumeQuietly(response?.Entity)
    }
  }

  /**
   * Initialise the http request with common header attributes
   *
   * @param request http request object
   */
  private function initRequestHeaders(request: HttpRequestBase) {
    request.setHeader(HttpHeaders.ACCEPT, "application/json")
    request.setHeader(HttpHeaders.CONTENT_TYPE, ContentType.APPLICATION_JSON.toString())

    if (ScriptParameters.APIMgmtOAuth2Enabled_ACC) {
      request.setHeader(HttpHeaders.AUTHORIZATION, "Bearer ${APIMgmtOAuth.Instance.getAccessToken()}")
    }

    // Include the subscription-key header if one available.
    var subscriptionkey = ConfigurationProperty.API_MGMT_SUBSCRIPTION_KEY.PropertyValue
    if (subscriptionkey != null) {
      request.setHeader("Ocp-Apim-Subscription-Key", subscriptionkey)
    }

    var requestConfig = RequestConfig.custom()
        .setSocketTimeout(ConfigurationProperty.API_MGMT_SOCKET_TIMEOUT.PropertyValue.toInt())
        .setConnectTimeout(ConfigurationProperty.API_MGMT_CONNECTION_TIMEOUT.PropertyValue.toInt())
        .build();
    request.setConfig(requestConfig)
  }

}
