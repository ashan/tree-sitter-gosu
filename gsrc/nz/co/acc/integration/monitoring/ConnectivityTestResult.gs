package nz.co.acc.integration.monitoring

/**
 * Created by Mike Ourednik on 27/03/20.
 */
class ConnectivityTestResult {
  var _isSuccessful : Boolean as readonly Successful
  var _response: String as readonly Response
  var _error: String as readonly Error

  public construct(isSuccessful : Boolean, response: String, error: String) {
    _isSuccessful = isSuccessful
    _response = response
    _error = error
  }
}