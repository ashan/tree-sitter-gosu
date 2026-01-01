package nz.co.acc.common.integration.security.ui

uses nz.co.acc.common.integration.security.ACCKeyVaultAPI

uses java.io.PrintWriter
uses java.io.StringWriter

/**
 * Helper class for the KeyVault Connectivity Tester UI.
 * <p>
 * Created by Nick Mei on 06/09/2017.
 */
class KeyVaultConnectivityTestPcfHelper {
  var _status: Status as readonly Status = new Status()
  var _keyVaultAPI = new ACCKeyVaultAPI();

  class Status {
    var _success: Boolean as IsSuccessful
    var _output: String as Output
    var _timestamp: Date as Timestamp
  }

  function getAuthorisationUrl(): String {
    return _keyVaultAPI.getAuthorisationURL()
  }

  /**
   * Establish a new connection to the KeyVault endpoint.
   */
  function testConnectivity() {

    _status.IsSuccessful = false
    _status.Output = null
    try {
      var accessToken = _keyVaultAPI.getAccessToken()
      if (accessToken?.NotBlank) {
        _status.Output = null
        _status.IsSuccessful = true
      }
    } catch (e: Exception) {
      var stackTrace = new StringWriter();
      e.printStackTrace(new PrintWriter(stackTrace))
      _status.Output = stackTrace.toString()
    }
    _status.Timestamp = new Date()
  }

  function isConnectivityEnabled(): boolean {
    return getAuthorisationUrl()?.NotBlank
  }
}
