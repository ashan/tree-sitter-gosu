package edge.capabilities.policycommon.availability
uses edge.capabilities.address.IAddressPlugin
uses edge.PlatformSupport.Bundle
uses java.util.Date
uses gw.api.util.Logger
uses edge.capabilities.address.dto.AddressDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.quote.lob.ILobDraftPlugin
uses edge.util.helper.JurisdictionUtil
uses edge.capabilities.quote.lob.dto.DraftLobDataDTO

/**
 * Default implementation of availability plugin. This implementation is not 
 * strongly compatible with product availability model. It can create both
 * false-negative and false-positive reports about availability.
 */
class DefaultProductAvailabilityPlugin implements IProductAvailabilityPlugin {
  
  private static final var LOGGER = Logger.forCategory(DefaultProductAvailabilityPlugin.Type.QName)
  
  private var _addressPlugin : IAddressPlugin

  private var _lobs : ILobDraftPlugin <DraftLobDataDTO>


  @ForAllGwNodes
  @Param("lobs", "Line-of-business extension plugin")
  @Param("addressPlugin", "Plugin used for address manipulations")
  construct(lobs : ILobDraftPlugin < DraftLobDataDTO>, addressPlugin : IAddressPlugin) {
    this._lobs = lobs
    this._addressPlugin = addressPlugin
  }



  override function isProductAvailable(productCode : String, effectiveDate : Date, location : AddressDTO) : AvailabilityResult {
    if (!_lobs.compatibleWithProduct(productCode)) {
      return AvailabilityResult.unavailable()
    }

    if (location != null && location.PostalCode == "00000") {
      LOGGER.warn("Using hardcoded invalid postal code. Returning unavailable")
      return AvailabilityResult.unavailable()
    }

    if (location != null && location.State == null) {
      LOGGER.error("Attempt to check availability for address without state")
      return AvailabilityResult.available()
    }
    
    return Bundle.resolveInTransaction(\ bundle -> {
      final var availabilityLookup = new PolicyProductRoot()
      if(location != null) {
        availabilityLookup.State = JurisdictionUtil.getJurisdiction(location.State)
      }
      final var lookups = gw.api.system.PCDependenciesGateway.getLookupTableManager().lookup("ProductLookup", availabilityLookup, effectiveDate)?.asArrayOf(ProductLookup)
      final var unavailableLookups = lookups
        .where(\ a -> 
          a.Availability == AvailabilityType.TC_UNAVAILABLE && 
          a.ProductCode == productCode)

      if(location != null) {
        unavailableLookups.where( \ a ->
            a.State == availabilityLookup.State)
      }
      
      /** Everything is available. */   
      if (!unavailableLookups.HasElements) {
        return AvailabilityResult.available()
      }

      final var limits = unavailableLookups.where(\ p -> p.EndEffectiveDate != null)
      if (limits.isEmpty()) {
        /* General unavailability. */
        return AvailabilityResult.unavailable()
      }
      
      final var availableSince = unavailableLookups.where(\ p -> p.EndEffectiveDate != null)*.EndEffectiveDate.sort().last() 
      return AvailabilityResult.availableSince(availableSince)
    })
  } 
}
