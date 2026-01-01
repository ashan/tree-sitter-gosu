package nz.co.acc.edge.capabilities.address

uses edge.capabilities.address.IAddressPlugin
uses entity.Address
uses nz.co.acc.edge.capabilities.address.dto.AddressDTO_ACC
uses entity.AccountContact

/**
 * Created by nitesh.gautam on 09-Jun-17.
 */
interface IAddressPlugin_ACC extends IAddressPlugin {

  function toAddressDTO_ACC(address: Address, isPrimaryAddress: Boolean): AddressDTO_ACC

  function fillAddressEntity_ACC(address: Address, addressDTO: AddressDTO_ACC)

  function createAddress_ACC(accountContact: AccountContact, addressChangeDTO: AddressDTO_ACC): AddressDTO_ACC

  function updateAddress_ACC(accountContact: AccountContact, addressChangeDTO: AddressDTO_ACC): AddressDTO_ACC
}