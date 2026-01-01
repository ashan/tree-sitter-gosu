package nz.co.acc.integration.monitoring.impl

uses nz.co.acc.integration.monitoring.ConnectivityTestResult
uses nz.co.acc.integration.monitoring.IConnectivityTester
uses nz.co.acc.plm.integration.validation.nzbnvalidation.MBIEAPIClientConnectivityTestHelper

/**
 * Created by Mike Ourednik on 27/03/20.
 */
class NZBNValidationAPIConnectivityTester implements IConnectivityTester {

  override function testConnectivity(): ConnectivityTestResult {
    var helper = new MBIEAPIClientConnectivityTestHelper()
    helper.testConnectivity()
    var result = helper.Result

    if (result.contains("Error")) {
      return new ConnectivityTestResult(false, null, result)
    } else {
      return new ConnectivityTestResult(true, result, null)
    }
  }
}