package nz.co.acc.integration.monitoring.impl

uses nz.co.acc.integration.monitoring.ConnectivityTestResult
uses nz.co.acc.integration.monitoring.IConnectivityTester

/**
 * Created by Mike Ourednik on 27/03/20.
 */
class CRMConnectivityTester implements IConnectivityTester {

  override function testConnectivity(): ConnectivityTestResult {
    var helper = new nz.co.acc.common.integration.apimgmt.ui.APIMgmtConnectivityTestPcfHelper()
    helper.testConnectivity()
    var status = helper.Status

    if (status.IsSuccessful) {
      return new ConnectivityTestResult(true, status.Output, null)
    } else {
      return new ConnectivityTestResult(false, null, status.Output)
    }
  }

}