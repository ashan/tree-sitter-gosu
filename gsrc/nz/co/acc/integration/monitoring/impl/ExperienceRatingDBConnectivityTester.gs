package nz.co.acc.integration.monitoring.impl

uses nz.co.acc.integration.monitoring.ConnectivityTestResult
uses nz.co.acc.integration.monitoring.IConnectivityTester

/**
 * Created by Mike Ourednik on 27/03/20.
 */
class ExperienceRatingDBConnectivityTester implements IConnectivityTester {

  override function testConnectivity(): ConnectivityTestResult {
    var helper = new nz.co.acc.plm.util.db.ERDatabaseConnectionHelper()
    var ConnectionUrl = helper.ConnectionUrl
    helper.testConnectivity()
    var status = helper.Status

    if (status.IsSuccessful) {
      return new ConnectivityTestResult(true, status.Result, null)
    } else {
      return new ConnectivityTestResult(false, null, status.Result)
    }
  }

}