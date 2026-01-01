package nz.co.acc.common.integration.webservices

uses gw.api.util.DateUtil

uses java.net.HttpURLConnection
uses java.net.URL

/**
 * Created by fabianr on 23/08/2017.
 */
class WebServiceConnectityTest {
  private static var REQUEST_METHOD: String = "GET"
  private var _successful: Boolean as Successful
  private var _URL: String as URL
  private var _output: String as Output
  private var _timeStamp: Date as TimeStamp
  private var _connectioName: String as ConnectionName

  construct() {
  }

  construct(connectionName: String, url: String) {
    this._URL = url
    this._connectioName = connectionName
  }

  public function testConnectivity(): String {
    this._output = " URL : ${this._URL}\n HTTP Method : ${REQUEST_METHOD}"
    var httpConnection: HttpURLConnection = null
    this._timeStamp = DateUtil.currentDate()
    try {
      var url = new URL(this._URL);
      httpConnection = url.openConnection() as HttpURLConnection
      httpConnection.setRequestMethod(REQUEST_METHOD);
      this._output = "${this._output}\n HTTP Status : ${httpConnection.ResponseCode}\n HTTP ResponseMessage : ${httpConnection.ResponseMessage}"
      this._successful = true
    } catch (e: Exception) {
      this._output = "${this._output}\n Error :${e} "
      this._successful = false
    } finally {
      if (httpConnection != null) httpConnection.disconnect()
    }
    return this._output
  }

}

