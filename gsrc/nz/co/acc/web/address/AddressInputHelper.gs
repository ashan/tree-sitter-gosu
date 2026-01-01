package nz.co.acc.web.address

class AddressInputHelper {
  public var displayAddressDiffersMessage : boolean = false

  function addressSearchPostOnChange(addressOwner : gw.api.address.AddressOwner) {
    if (addressOwner.AutofillEnabled) {
      gw.api.contact.AddressAutocompleteUtil.autofillAddress(addressOwner.AddressDelegate, "AddressFinder_ACC", true)
      // display address message if the physical and postal address differ and a physical address was selected
      displayAddressDiffersMessage = !addressOwner.AddressDelegate.PhysicalAddressSameAsPostalAddress_ACC and addressOwner.AddressDelegate.SelectedAddressPhysical_ACC
      // set the Postal/Physical address
      if (displayAddressDiffersMessage or !addressOwner.AddressDelegate.SelectedAddressPhysical_ACC or addressOwner.AddressDelegate.BoxTypeExists_ACC) {
        addressOwner.Address.AddressLocType_ACC = AddressLocationType_ACC.TC_POSTAL
      } else {
        addressOwner.Address.AddressLocType_ACC = AddressLocationType_ACC.TC_PHYSICAL
      }
    }
  }
}