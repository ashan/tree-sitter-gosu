package edge.capabilities.address

uses edge.jsonrpc.IRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses java.lang.IllegalArgumentException
uses edge.capabilities.address.dto.AddressLookupResultsDTO
uses edge.capabilities.address.dto.AddressLookupDTO

/**
 * Address Lookup handler.
 */
class AddressLookupHandler implements IRpcHandler {

  var _addressLookupPlugin : IAddressLookupPlugin

  @InjectableNode
  construct(addressLookupPlugin:IAddressLookupPlugin) {
    _addressLookupPlugin = addressLookupPlugin
  }

  /**
   * Looks up possible addresses given a partial address as a string
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the partial address provided was null</dd>
   * </dl>
   *
   * @param partialAddress a partial address
   * @return results of the address lookup
   */
  @JsonRpcUnauthenticatedMethod
  public function lookupAddressUsingString( partialAddress : String ) : AddressLookupResultsDTO {
    if (partialAddress == null){
      throw new IllegalArgumentException("Null Partial Address passed to AddressLookupHandler")
    }

    return _addressLookupPlugin.lookupAddressUsingString(partialAddress)
  }

  /**
   * Looks up possible addresses given a partial address as an AddressDTO
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - if the partial address provided was null</dd>
   * </dl>
   *
   * @param partialAddress a partial address
   * @return results of the address lookup
   */
  @JsonRpcUnauthenticatedMethod
  public function lookupAddressUsingObject( partialAddress : AddressLookupDTO ) : AddressLookupResultsDTO {
    if (partialAddress == null){
      throw new IllegalArgumentException("Null Partial Address passed to AddressLookupHandler")
    }

    return _addressLookupPlugin.lookupAddressUsingObject(partialAddress)
  }

}
