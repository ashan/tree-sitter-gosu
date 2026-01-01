package nz.co.acc.integration.monitoring.impl

uses nz.co.acc.integration.monitoring.ConnectivityTestResult
uses nz.co.acc.integration.monitoring.IConnectivityTester

/**
 * Created by Mike Ourednik on 27/03/20.
 */
class KeyVaultConnectivityTester implements IConnectivityTester {

  override function testConnectivity(): ConnectivityTestResult {
    var helper = new nz.co.acc.common.integration.security.ui.KeyVaultConnectivityTestPcfHelper()
    helper.testConnectivity()

    if (helper.Status.IsSuccessful) {
      return new ConnectivityTestResult(true, helper.Status.Output, null)
    } else {
      return new ConnectivityTestResult(false, null, helper.Status.Output)
    }
  }

}