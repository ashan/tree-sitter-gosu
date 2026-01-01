package edge.capabilities.address
uses edge.capabilities.address.dto.AddressDTO

interface IPolicyAddressPlugin {

  /**
   * Converts address to DTO object.
   */
  function toDto(address : PolicyAddress) : AddressDTO

  /**
   * Updates address from the dto.
   */
  function updateFromDTO(address : PolicyAddress, dto : AddressDTO)
}
