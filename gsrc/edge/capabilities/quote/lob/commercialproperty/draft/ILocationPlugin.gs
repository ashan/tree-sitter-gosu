package edge.capabilities.quote.lob.commercialproperty.draft
uses edge.capabilities.quote.lob.commercialproperty.draft.dto.LocationDTO
uses edge.capabilities.address.dto.AddressDTO
uses edge.PlatformSupport.Bundle

/**
 * Interface used by LOBs to extend metadata generation for quote handler. At this moment only question set extensions
 * are supported.
 */
interface ILocationPlugin {
  public function toDTO(location : CPLocation) : LocationDTO
  public function updateLocation(location : CPLocation, dto : LocationDTO) : CPLocation
  public function territoryCodeLookup(jobNumber : String, address : AddressDTO, bundle : Bundle) : String
}
