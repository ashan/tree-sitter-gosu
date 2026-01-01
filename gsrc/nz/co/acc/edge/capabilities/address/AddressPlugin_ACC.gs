package nz.co.acc.edge.capabilities.address

uses edge.capabilities.address.DefaultAddressPlugin
uses edge.di.annotations.ForAllNodes
uses entity.AccountContact
uses entity.Address
uses gw.api.locale.DisplayKey
uses gw.api.webservice.exception.BadIdentifierException
uses nz.co.acc.edge.capabilities.address.dto.AddressDTO_ACC
uses nz.co.acc.edge.capabilities.helpers.AccountUtil_ACC
uses nz.co.acc.edge.capabilities.helpers.AddressUtil_ACC
uses nz.co.acc.edge.capabilities.helpers.EdgeConstants_ACC
uses org.apache.commons.lang3.StringUtils

/**
 * Created by nitesh.gautam on 09-Jun-17.
 */
class AddressPlugin_ACC extends DefaultAddressPlugin implements IAddressPlugin_ACC {

  @ForAllNodes
  construct() {
    super()
  }

  /**
   * Copies Address entity fields into AddressDTO_ACC
   *
   * @param addressDTO       Target AddressDTO object
   * @param address          Source Address entity
   * @param isPrimaryAddress Boolean value indicating if source address has been set as the primary address for its contact
   */
  public static function fillAddressDTO(addressDTO: AddressDTO_ACC, address: Address, isPrimaryAddress: Boolean) {
    addressDTO.PublicID = address.PublicID
    addressDTO.DisplayName = address.DisplayName == EdgeConstants_ACC.UNKNOWN_ADDRESS_VALUE ? EdgeConstants_ACC.EMPTY_STRING_VALUE : address.DisplayName
    addressDTO.Attention = address.Attention_ACC
    addressDTO.AddressLine1 = address.AddressLine1 == EdgeConstants_ACC.UNKNOWN_ADDRESS_VALUE ? EdgeConstants_ACC.EMPTY_STRING_VALUE : address.AddressLine1
    addressDTO.AddressLine1Kanji = address.AddressLine1Kanji == EdgeConstants_ACC.UNKNOWN_ADDRESS_VALUE ? EdgeConstants_ACC.EMPTY_STRING_VALUE : address.AddressLine1Kanji
    addressDTO.AddressLine2 = address.AddressLine2 == EdgeConstants_ACC.UNKNOWN_ADDRESS_VALUE ? EdgeConstants_ACC.EMPTY_STRING_VALUE : address.AddressLine2
    addressDTO.AddressLine2Kanji = address.AddressLine2Kanji == EdgeConstants_ACC.UNKNOWN_ADDRESS_VALUE ? EdgeConstants_ACC.EMPTY_STRING_VALUE : address.AddressLine2Kanji
    addressDTO.AddressLine3 = address.AddressLine3 == EdgeConstants_ACC.UNKNOWN_ADDRESS_VALUE ? EdgeConstants_ACC.EMPTY_STRING_VALUE : address.AddressLine3
    addressDTO.City = address.City == EdgeConstants_ACC.UNKNOWN_ADDRESS_VALUE ? EdgeConstants_ACC.EMPTY_STRING_VALUE : address.City
    addressDTO.CityKanji = address.CityKanji == EdgeConstants_ACC.UNKNOWN_ADDRESS_VALUE ? EdgeConstants_ACC.EMPTY_STRING_VALUE : address.CityKanji
    addressDTO.State = address.State
    addressDTO.PostalCode = address.PostalCode == EdgeConstants_ACC.UNKNOWN_ADDRESS_VALUE ? EdgeConstants_ACC.EMPTY_STRING_VALUE : address.PostalCode
    addressDTO.Country = address.Country == Country.TC_UNKNOWN_ACC ? null : address.Country
    addressDTO.AddressType = address.AddressType == AddressType.TC_UNKNOWNACC ? null : address.AddressType
    addressDTO.IsInvalid = AddressUtil_ACC.isAddressInvalid(address)
    addressDTO.AddressLocationType = address.AddressLocType_ACC
    addressDTO.IsWPCAddress = address.IsWPCAddress_ACC
    addressDTO.IsWPSAddress = address.IsWPSAddress_ACC
    addressDTO.IsCPCXAddress = address.IsCPCPXAddress_ACC
    addressDTO.IsPrimaryAddress = isPrimaryAddress
  }

  /**
   * Copies AddressDTO fields into Address entity.
   *
   * Sets address.ValidUntil = null
   *
   * @param address    Target Address entity
   * @param addressDTO Source AddressDTO object
   */
  override function fillAddressEntity_ACC(address: Address, addressDTO: AddressDTO_ACC) {
    // Copy addressDTO fields
    address.Attention_ACC = StringUtils.trimToNull(addressDTO.Attention)
    address.AddressLine1 = StringUtils.trimToNull(addressDTO.AddressLine1)
    address.AddressLine1Kanji = StringUtils.trimToNull(addressDTO.AddressLine1Kanji)
    address.AddressLine2 = StringUtils.trimToNull(addressDTO.AddressLine2)
    address.AddressLine2Kanji = StringUtils.trimToNull(addressDTO.AddressLine2Kanji)
    address.AddressLine3 = StringUtils.trimToNull(addressDTO.AddressLine3)
    address.City = StringUtils.trimToNull(addressDTO.City)
    address.CityKanji = StringUtils.trimToNull(addressDTO.CityKanji)
    address.State = addressDTO.State
    address.PostalCode = StringUtils.trimToNull(addressDTO.PostalCode)
    address.Country = addressDTO.Country
    address.AddressType = addressDTO.AddressType
    address.AddressLocType_ACC = addressDTO.AddressLocationType
    if (addressDTO.IsWPCAddress != null) address.IsWPCAddress_ACC = addressDTO.IsWPCAddress
    if (addressDTO.IsWPSAddress != null) address.IsWPSAddress_ACC = addressDTO.IsWPSAddress
    if (addressDTO.IsCPCXAddress != null) address.IsCPCPXAddress_ACC = addressDTO.IsCPCXAddress

    // Reset ValidUntil field
    address.ValidUntil = null
  }

  /**
   * Creates an AddressDTO corresponding to the given Address entity
   *
   * @param address          Source Address entity
   * @param isPrimaryAddress Boolean value indicating if source address has been set as the primary address for its contact
   * @return
   */
  override function toAddressDTO_ACC(address: Address, isPrimaryAddress: Boolean): AddressDTO_ACC {
    if (address == null) {
      return null
    }
    final var res = new AddressDTO_ACC()
    fillAddressDTO(res, address, isPrimaryAddress)
    return res
  }

  /**
   * Create a new account holder address
   *
   * @param addressChangeDTO
   * @return Full details of the new created address
   */
  override function createAddress_ACC(
      accountContact: AccountContact,
      addressDTO: AddressDTO_ACC): AddressDTO_ACC {

    var addressChangeResult = new AddressDTO_ACC()

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {

      bundle.add(accountContact)
      var newAddress = new Address(bundle)
      fillAddressEntity_ACC(newAddress, addressDTO)

      if (addressDTO.IsPrimaryAddress) {
        accountContact.Contact.makePrimaryAddress(newAddress)
      } else {
        accountContact.Contact.addAddress(newAddress)
      }
      if (addressDTO.IsCPCXAddress) {
        accountContact.Contact.setCPCPXAddress_ACC(newAddress)
      }
      if (addressDTO.IsWPCAddress) {
        accountContact.Contact.setWPCAddress_ACC(newAddress)
      }
      if (addressDTO.IsWPSAddress) {
        accountContact.Contact.setWPSAddress_ACC(newAddress)
      }

      addressChangeResult = toAddressDTO_ACC(newAddress, addressDTO.IsPrimaryAddress)
    })

    return addressChangeResult
  }

  /**
   * Updates an account holder contact address
   *
   * @param accountHolderContact The account holder which has an address we want to update
   * @param addressDTO           The updated address details, which includes the existing target address publicID
   * @return
   */
  override function updateAddress_ACC(
      accountHolderContact: AccountContact,
      addressDTO: AddressDTO_ACC): AddressDTO_ACC {

    var addressChangeResult = new AddressDTO_ACC()

    var optionalAddress = findAddressWithID(accountHolderContact.Contact.AllAddresses, addressDTO.PublicID)
    if (!optionalAddress.isPresent()) {
      throw new BadIdentifierException(
          DisplayKey.get("Edge.Capabilities.Address.AddressPlugin_ACC.UpdateAddress_ACC.Exception.AddressNotFound_ACC",
              accountHolderContact.Account.ACCID_ACC,
              addressDTO.PublicID))
    }
    var targetAddress = optionalAddress.get()

    performUpdateAddressValidations(addressDTO, accountHolderContact, targetAddress)

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {

      bundle.add(accountHolderContact)
      bundle.add(targetAddress)
      fillAddressEntity_ACC(targetAddress, addressDTO)

      if (addressDTO.IsPrimaryAddress) {
        accountHolderContact.Contact.makePrimaryAddress(targetAddress)
      } else {
        accountHolderContact.Contact.addAddress(targetAddress)
      }
      if (addressDTO.IsCPCXAddress) {
        accountHolderContact.Contact.setCPCPXAddress_ACC(targetAddress)
      }
      if (addressDTO.IsWPCAddress) {
        accountHolderContact.Contact.setWPCAddress_ACC(targetAddress)
      }
      if (addressDTO.IsWPSAddress) {
        accountHolderContact.Contact.setWPSAddress_ACC(targetAddress)
      }

      addressChangeResult = toAddressDTO_ACC(targetAddress, addressDTO.IsPrimaryAddress)
    })

    return addressChangeResult
  }

  private function performUpdateAddressValidations(
      addressDTO: AddressDTO_ACC,
      accountHolder: AccountContact,
      targetAddress: Address) {

    // Can not change an existing primary address to not primary.
    var targetAddressIsPrimary = targetAddress.PublicID == accountHolder.Contact.PrimaryAddress.PublicID
    if (targetAddressIsPrimary && !addressDTO.IsPrimaryAddress) {
      throw new IllegalArgumentException(
          DisplayKey.get("Edge.Capabilities.Address.AddressPlugin_ACC.UpdateAddress_ACC.Exception.RemovePrimary_ACC"))
    }

    // Can not change preferred address to agent address if there is no existing claims address.
    if (targetAddress.AddressType == AddressType.TC_PREFERREDACC
        && addressDTO.AddressType == AddressType.TC_AGENTACC
        && !AccountUtil_ACC.hasClaimsAddress(accountHolder)) {
      throw new IllegalArgumentException(
          DisplayKey.get("Edge.Capabilities.Address.AddressPlugin_ACC.UpdateAddress_ACC.Exception.ChangePreferredToAgent_ACC"))
    }
  }

  private function findAddressWithID(addresses: Address[], addressPublicId: String): Optional<Address> {
    return Optional.ofNullable(addresses.firstWhere(\address -> address.PublicID == addressPublicId))
  }
}