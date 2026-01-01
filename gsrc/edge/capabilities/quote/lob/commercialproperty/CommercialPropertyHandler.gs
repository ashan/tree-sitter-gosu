package edge.capabilities.quote.lob.commercialproperty

uses edge.jsonrpc.IRpcHandler
uses edge.capabilities.quote.lob.commercialproperty.draft.ILocationPlugin
uses edge.di.annotations.InjectableNode
uses edge.capabilities.quote.lob.commercialproperty.draft.IBuildingPlugin
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.address.dto.AddressDTO
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.PlatformSupport.Bundle

class CommercialPropertyHandler implements IRpcHandler {

  private var _locationPlugin : ILocationPlugin
  private var _buildingPlugin : IBuildingPlugin

  @InjectableNode
  @Param("lookupPlugin", "Plugin used to obtain vehicle information")
  construct(aLocationPlugin : ILocationPlugin, aBuildingPlugin : IBuildingPlugin) {
      this._buildingPlugin = aBuildingPlugin
      this._locationPlugin = aLocationPlugin
  }

  /**
   * Returns true if building code is valid
   *
   * @param code a building code
   * @return true or false depending on the validity of the code
   */

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function buildingCodeIsValid( code : String ) : Boolean {
    return _buildingPlugin.isBuildingCodeValid(code)
  }

  /**
   * Returns a TerritoryCode based on the current PolicyPeriod and Location Address
   *
   * @param code a building code
   * @return true or false depending on the validity of the code
   */

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function getDefaultTerritoryCode( submissionNumber: String, addressDTO: AddressDTO ) : String {
    final var bundle = Bundle.getCurrent()
    return _locationPlugin.territoryCodeLookup(submissionNumber, addressDTO, bundle)
  }

}
