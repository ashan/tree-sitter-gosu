package nz.co.acc.integration.monitoring

/**
 * Created by Mike Ourednik on 27/03/20.
 */
interface IConnectivityTester {

  function testConnectivity() : ConnectivityTestResult

}