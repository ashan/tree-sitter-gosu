package edge.capabilities.policycommon.availability

uses edge.jsonrpc.IRpcHandler
uses edge.capabilities.address.IAddressPlugin
uses edge.di.annotations.InjectableNode
uses edge.capabilities.address.IAddressCompletionPlugin
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.capabilities.policycommon.availability.dto.PostalCodeAvailabilityRequestDTO
uses edge.capabilities.policycommon.availability.dto.AvailabilityResponseDTO
uses edge.jsonrpc.exception.JsonRpcInternalErrorException
uses edge.capabilities.policycommon.availability.dto.AddressAvailabilityRequestDTO
uses edge.capabilities.address.dto.AddressDTO
uses java.util.Date
uses edge.capabilities.policycommon.availability.dto.EffectiveDateAvailabilityRequestDTO

/* Quote availability handler. */
class AvailabilityHandler implements IRpcHandler {

  private var _addressPlugin : IAddressPlugin
  private var _plugin : IProductAvailabilityPlugin
  private var _addressCompletion : IAddressCompletionPlugin


  @InjectableNode
  @Param("addressPlugin", "Plugin used for address manipulation")
  @Param("productAvailabilityPlugin", "Plugin to perform a quick availability check")
  @Param("addressCompletion", "Plugin used for the addresses completion")
  construct(addressPlugin : IAddressPlugin, productAvailabilityPlugin : IProductAvailabilityPlugin, addressCompletion : IAddressCompletionPlugin) {
    this._addressPlugin = addressPlugin
    this._plugin = productAvailabilityPlugin
    this._addressCompletion = addressCompletion
  }

  /**
   * Check if a product is available given a product code, an effective date and a postal code
   *
   * @param dto details of a product availability check including a product code, effective date and a postal code
   * @returns true if the product is available or false otherwise
   */
  @JsonRpcUnauthenticatedMethod
  public function isProductAvailableBasedOnPostalCode(dto : PostalCodeAvailabilityRequestDTO) : AvailabilityResponseDTO{
    return isProductAvailable(dto.ProductCode, dto.EffectiveDate, _addressCompletion.getAddressFromZipCode(dto.PostalCode))
  }

  /**
   * Check if a product is available given a product code, an effective date and a full address
   *
   * @param dto details of a product availability check including a product code, effective date and a full address
   * @returns true if the product is available or false otherwise
   */
  @JsonRpcUnauthenticatedMethod
  public function isProductAvailableBasedOnAddress(dto : AddressAvailabilityRequestDTO) : AvailabilityResponseDTO{
    return isProductAvailable(dto.ProductCode, dto.EffectiveDate, dto.Address)
  }

  /**
   * Check if a product is available given a product code and an effective date
   *
   * @param dto details of a product availability check including a product code and effective date
   * @returns true if the product is available or false otherwise
   */
  @JsonRpcUnauthenticatedMethod
  public function isProductAvailableBasedOnEffDate(dto : EffectiveDateAvailabilityRequestDTO) : AvailabilityResponseDTO{
    return isProductAvailable(dto.ProductCode, dto.EffectiveDate, null)
  }

  /**
   * Uses address to determine whether or not a product is quotable based on PolicyCenter availability lookup tables.
   * The logic is based on examining what states have been defined as unavailable as opposed to available.
   */
  private function isProductAvailable(productCode: String, effectiveDate: Date, address: AddressDTO) : AvailabilityResponseDTO {
    final var avail = _plugin.isProductAvailable(productCode, effectiveDate, address)
    final var res = new AvailabilityResponseDTO()
    switch(avail.Code) {
      case AvailabilityCode.AVAILABLE:
          res.AddressCompletion = (address != null) ? address : new AddressDTO(){:Country = edge.PlatformSupport.Locale.DefaultCountry}
          res.IsAvailable = true
          return res
      case AvailabilityCode.UNAVAILABLE:
          res.IsAvailable = false
          return res
      case AvailabilityCode.WOULD_BE_AVAILABLE_SINCE_DATE:
          res.IsAvailable = false
          res.AvailableInFuture = avail.AvailableSince
          return res
      default:
        throw new JsonRpcInternalErrorException(){:Message = "Bad/incomplete availability code " + avail.Code}
    }
  }

}
