package nz.co.acc.plm.integration.validation.nzbnvalidation

/**
 * Created by Mike Ourednik on 2/11/2020.
 */
class MBIEAPIClientConnectivityTestHelper {

  private var _testResult : String as readonly Result
  private var _testResponse : String as readonly Response
  private var _nzbn : String as NZBN = "9429037784669"

  function testConnectivity() {

    var client = MBIEAPIClient.getInstance()
    try {
      var response : MBIEAPIClientResponse =  client.fetchData(_nzbn)
      if (response.StatusCode == 200) {
        _testResult = "Successful (NZBN exists - HTTP response 200)"
        _testResponse = client.fetchData(_nzbn).ResponseBody
      } else {
        _testResult = "Successful (NZBN not found - HTTP response 404)"
        _testResponse = client.fetchData(_nzbn).ResponseBody
      }
    } catch (e : Throwable) {
      _testResult = "Error: ${e.Message}"
    }
  }

}