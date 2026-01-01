package nz.co.acc.address

uses gw.api.address.AddressFillable
uses gw.api.address.AddressFillableExtension
uses gw.api.address.DefaultAddressAutocompletePlugin
uses gw.api.contact.AutocompleteHandler
uses gw.lang.reflect.ReflectUtil
uses nz.co.acc.plm.integration.validation.addressvalidation.AddressValidationAPI_ACC

/**
 * Created by Ian Rainford on 21/12/2016.
 */
class DynamicAddressAutoCompletePlugIn_ACC extends DefaultAddressAutocompletePlugin {

  var _addressValidationService: AddressValidationAPI_ACC

  override function autofillAddress( address : AddressFillable,  triggerField : String,  alwaysOverride : boolean) {
    var triggerValue = ReflectUtil.getProperty(address, triggerField)
    if (triggerValue != null) {
      var validatedAddress = ValidationService.getAddressMetadata_ACC(triggerValue.toString())
      if (validatedAddress.Matched and alwaysOverride) {
        address.AddressLine1 = validatedAddress.AddressLine1
        address.AddressLine2 = validatedAddress.AddressLine2
        address.AddressLine3 = validatedAddress.AddressLine3
        address.City = validatedAddress.AddressLineCity
        address.PostalCode = validatedAddress.Postcode
        // DE33 - Set the physical address same as postal address flag
        (address as AddressFillableExtension).PhysicalAddressSameAsPostalAddress_ACC = validatedAddress.isPhysicalAddressSameAsPostalAddress()
        // DE705 - Check if the selected address is the physical address
        (address as AddressFillableExtension).SelectedAddressPhysical_ACC = validatedAddress.isSelectedAddressPhysical(triggerValue.toString())
        (address as AddressFillableExtension).BoxTypeExists_ACC = validatedAddress.BoxTypeExists
      }
    }
  }

  override function createAutocompleteHandler(addressFieldName: String, additionalArgsNames: String[], waitForKeyPress: boolean): AutocompleteHandler {
    return new DynamicAddressAutoCompleteHandler_ACC(addressFieldName, additionalArgsNames, waitForKeyPress)
  }

  private property get ValidationService() : AddressValidationAPI_ACC {
    if (_addressValidationService == null) {
      _addressValidationService = new AddressValidationAPI_ACC()
    }
    return _addressValidationService
  }
}
