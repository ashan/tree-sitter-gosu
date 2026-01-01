package edge.capabilities.policycommon.availability

uses java.util.Date
uses edge.capabilities.address.dto.AddressDTO

/**
 * Plugging point to check portal product availability. This plugin
 * is used during submission process to ensure that nobody violates an
 * availability restriction.
 * <p>Implementations of this plugin should consult active ILobExtensionPlugin to 
 * ensure that product is supported.
 */
interface IProductAvailabilityPlugin {
  
  /**
   * Checks if given product is available at the given date and location.
   */
  @Param("productCode", "Product code to check for")
  @Param("effectiveDate", "Quote date")
  @Param("locationTemplate", "Partially-filled location for the product. This template may miss city, street address, etc..." +
    " Concrete implementations may impose some restriction on the template. For example, state or region may be a common requirement.")
  function isProductAvailable(productCode : String, effectiveDate : Date, locationTemplate : AddressDTO) : AvailabilityResult
}
