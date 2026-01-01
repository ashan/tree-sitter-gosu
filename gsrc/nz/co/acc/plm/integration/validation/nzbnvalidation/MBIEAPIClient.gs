package nz.co.acc.plm.integration.validation.nzbnvalidation


uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses nz.co.acc.plm.integration.http.HTTPConnectionPool
uses gw.lang.reflect.Expando
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.util.EntityUtils

uses java.lang.invoke.MethodHandles
uses java.net.URI
uses java.net.URL

/**
 * Calls NZBN Validation REST API
 * <p>
 * Created by Mike Ourednik on 17/08/20.
 */
class MBIEAPIClient {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  var _appId = ""
  var _host = ""
  var _path = ""

  construct() {
    _appId = ConfigurationProperty.NZBN_VALIDATIONAPI_APPID.PropertyValue
    _host = ConfigurationProperty.NZBN_VALIDATIONAPI_HOST.PropertyValue
    _path = ConfigurationProperty.NZBN_VALIDATIONAPI_PATH.PropertyValue
  }

  private function getUri(nzbn : String) : URI {
    return URL.makeUrl(_host + _path + nzbn, new Expando()).toURI()
  }

  function validateNZBN(nzbn : String) : Boolean {
    if (not isThirteenDigits(nzbn)) {
      return false
    }

    var mbieResult = fetchData(nzbn)

    if (mbieResult.StatusCode == 200) {
      return true
    } else if (mbieResult.StatusCode == 404) {
      return false
    } else {
      throw new MBIEApiClientException("MBIE Validation API returned statusCode=${mbieResult.StatusCode}, responseBody: ${mbieResult.ResponseBody}")
    }
  }

  function isThirteenDigits(nzbn: String) : boolean {
    if (nzbn == null) {
      return false
    }
    if (not nzbn.Numeric) {
      return false

    } else {
      return nzbn.length == 13
    }
  }

  function fetchData(nzbn : String) : MBIEAPIClientResponse {
    if (not _appId.NotBlank) {
      throw new MBIEApiClientException("AppId is not set. Check configuration.")
    }

    var uri = getUri(nzbn)
    _log.info("GET ${uri}")

    var httpGet = new HttpGet(uri);
    httpGet.addHeader("ACC-AppId", _appId)

    var httpClient = HTTPConnectionPool.getInstance().Client;
    var statusCode : Integer
    var responseBody : String
    try {
      var httpResponse = httpClient.execute(httpGet)
      using (httpResponse) {
        statusCode = httpResponse.getStatusLine().StatusCode
        responseBody = EntityUtils.toString(httpResponse.Entity)
        return new MBIEAPIClientResponse(statusCode, responseBody, nzbn)
      }
    } catch (e : Exception) {
      throw new MBIEApiClientException(e)
    }
  }

  private static class MBIEClient {
    private static final var INSTANCE: MBIEAPIClient = new MBIEAPIClient()
  }

  public static function getInstance() : MBIEAPIClient {
    return MBIEClient.INSTANCE
  }

}


