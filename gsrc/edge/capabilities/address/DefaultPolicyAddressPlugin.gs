package edge.capabilities.address

uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.address.dto.AddressDTO

class DefaultPolicyAddressPlugin implements IPolicyAddressPlugin {
  @ForAllGwNodes
  construct() {
  }

  override function toDto(address : PolicyAddress) : AddressDTO {
    if (address == null) {
      return null
    }
    final var res = new AddressDTO()
    fillAddress(res, address)
    return res
  }

  public static function fillAddress(res : AddressDTO, address : PolicyAddress) {
    res.PublicID = address.PublicID
    res.DisplayName = address.DisplayName
    res.AddressLine1 = address.AddressLine1
    res.AddressLine1Kanji = address.AddressLine1Kanji
    res.AddressLine2 = address.AddressLine2
    res.AddressLine2Kanji = address.AddressLine2Kanji
    res.AddressLine3 = address.AddressLine3
    res.City = address.City
    res.CityKanji = address.CityKanji
    res.State = address.State
    res.PostalCode = address.PostalCode
    res.Country = address.Country
    res.AddressType = address.AddressType
  }

  override function updateFromDTO(address : PolicyAddress, dto : AddressDTO) {
    address.AddressLine1 = dto.AddressLine1
    address.AddressLine1Kanji = dto.AddressLine1Kanji
    address.AddressLine2 = dto.AddressLine2
    address.AddressLine2Kanji = dto.AddressLine2Kanji
    address.AddressLine3 = dto.AddressLine3
    address.City = dto.City
    address.CityKanji = dto.CityKanji
    address.State = dto.State
    address.PostalCode = dto.PostalCode
    address.Country = dto.Country
    address.AddressType = dto.AddressType
    address.ValidUntil_ACC = null
  }
}
