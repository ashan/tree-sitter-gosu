package nz.co.acc.address

uses gw.api.contact.AddressAutocompleteHandler
uses gw.api.contact.AutocompleteResult
uses nz.co.acc.plm.integration.validation.addressvalidation.AddressValidationAPI_ACC

/**
 * Created by Ian Rainford on 21/12/2016.
 */
class DynamicAddressAutoCompleteHandler_ACC extends AddressAutocompleteHandler {

  var _addressValidationService: AddressValidationAPI_ACC

  construct(addressFieldName: String, additionalArgsNames: String, waitForKeyPress: boolean) {
    super(addressFieldName, additionalArgsNames, waitForKeyPress)
  }

  construct(addressFieldName: String, additionalArgsNames: String[], waitForKeyPress: boolean) {
    super(addressFieldName, additionalArgsNames, waitForKeyPress)
  }

  override function getSuggestions(textSoFar: String, caretPos: int, additionalArgs: Object[]): AutocompleteResult[] {
    var results = new ArrayList<AutocompleteResult>()

    var serviceResults = ValidationService.getMatchingAddresses_ACC(textSoFar)
    for (address in serviceResults) {
      results.add(new AutocompleteResult(address.Address, address.Address, true))
    }
    return results.toTypedArray()
  }

  private property get ValidationService() : AddressValidationAPI_ACC {
    if (_addressValidationService == null) {
      _addressValidationService = new AddressValidationAPI_ACC()
    }
    return _addressValidationService
  }
}
