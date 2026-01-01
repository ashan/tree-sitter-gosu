package nz.co.acc.integration.monitoring.impl

uses nz.co.acc.integration.monitoring.ConnectivityTestResult
uses nz.co.acc.integration.monitoring.IConnectivityTester
uses nz.co.acc.plm.integration.validation.addressvalidation.ui.AddressValidationCheckUIHelper_ACC

/**
 * Created by Mike Ourednik on 27/03/20.
 */
class AddressVerificationAPIConnectivityTester implements IConnectivityTester {

  override function testConnectivity(): ConnectivityTestResult {
    var helper = new AddressValidationCheckUIHelper_ACC()
    helper.testAddressVerification()
    var result = helper.VerificationeResult

    if (result.contains("Exception")) {
      return new ConnectivityTestResult(false, null, result)
    } else {
      return new ConnectivityTestResult(true, result, null)
    }
  }
}