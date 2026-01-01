package nz.co.acc.edge.capabilities.monitoring

uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcMethod
uses nz.co.acc.edge.capabilities.monitoring.dto.ConnectivityTestResultDTO_ACC
uses nz.co.acc.integration.monitoring.ConnectivityTestResult
uses nz.co.acc.integration.monitoring.impl.AddressAutocompleteAPIConnectivityTester
uses nz.co.acc.integration.monitoring.impl.AddressVerificationAPIConnectivityTester
uses nz.co.acc.integration.monitoring.impl.CRMConnectivityTester
uses nz.co.acc.integration.monitoring.impl.ExperienceRatingDBConnectivityTester
uses nz.co.acc.integration.monitoring.impl.KeyVaultConnectivityTester
uses nz.co.acc.integration.monitoring.impl.NZBNValidationAPIConnectivityTester
uses nz.co.acc.integration.monitoring.impl.SharepointConnectivityTester

/**
 * Created by Mike Ourednik on 27/03/20.
 */
class ConnectivityHandler_ACC implements IRpcHandler {

  @InjectableNode
  construct() {
  }

  @JsonRpcMethod
  function testAddressAutocompleteAPI() : ConnectivityTestResultDTO_ACC {
    var result = new AddressAutocompleteAPIConnectivityTester().testConnectivity()
    return toDTO(result)
  }

  @JsonRpcMethod
  function testAddressVerificationAPI() : ConnectivityTestResultDTO_ACC {
    var result = new AddressVerificationAPIConnectivityTester().testConnectivity()
    return toDTO(result)
  }

  @JsonRpcMethod
  function testExperienceRatingDB() : ConnectivityTestResultDTO_ACC {
    var result = new ExperienceRatingDBConnectivityTester().testConnectivity()
    return toDTO(result)
  }

  @JsonRpcMethod
  function testCRM() : ConnectivityTestResultDTO_ACC {
    var result = new CRMConnectivityTester().testConnectivity()
    return toDTO(result)
  }

  @JsonRpcMethod
  function testNZBNValidationAPI() : ConnectivityTestResultDTO_ACC {
    var result = new NZBNValidationAPIConnectivityTester().testConnectivity()
    return toDTO(result)
  }

  @JsonRpcMethod
  function testKeyVault() : ConnectivityTestResultDTO_ACC {
    var result = new KeyVaultConnectivityTester().testConnectivity()
    return toDTO(result)
  }

  @JsonRpcMethod
  function testSharePoint() : ConnectivityTestResultDTO_ACC {
    var result = new SharepointConnectivityTester().testConnectivity()
    return toDTO(result)
  }

  private function toDTO(status : ConnectivityTestResult) : ConnectivityTestResultDTO_ACC {
    var dto = new ConnectivityTestResultDTO_ACC()
    dto.Successful = status.Successful
    dto.Response = status.Response
    dto.Error = status.Error
    return dto
  }

}