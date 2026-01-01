package nz.co.acc.plm.integration.validation.addressvalidation.ui

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.plm.integration.validation.addressvalidation.AddressValidationAPI_ACC

/**
 * Created by CortesS on 10/01/2017.
 */
class AddressValidationCheckUIHelper_ACC {

  private var _partialAddress: String as PartialAddress
  private var _fullAddress: String as FullAddress
  private var _autocompleteResult: String as AutocompleteResult
  private var _verificationResult: String as VerificationeResult
  private var _selectedServiceAA: String as SelectedServiceAA
  private var _selectedServiceAV: String as SelectedServiceAV
  private var avs: AddressValidationAPI_ACC

  construct() {
    _selectedServiceAA = ""
    _selectedServiceAV = ""
    _autocompleteResult = ""
    _partialAddress = DisplayKey.get("Web.Admin.IntegrationTools.ConnectivityTest_ACC.AddressAutocomplete.InputPlaceholder")
    _fullAddress = DisplayKey.get("Web.Admin.IntegrationTools.ConnectivityTest_ACC.AddressVerification.InputPlaceholder")
  }


  public function testAddressAutocomplete() {

    avs = new AddressValidationAPI_ACC()
    _autocompleteResult = ""

    try {
      var resultList = avs.getMatchingAddresses_ACC(_partialAddress)
      if (resultList.IsEmpty) {
        _autocompleteResult = "No matching addresses"
      } else {
        for (item in resultList index i) {
          _autocompleteResult = _autocompleteResult + "\n" + (i + 1) + ".\t " + item.Address
        }
      }
    } catch (de: DisplayableException) {
      _autocompleteResult = "Exception error : " + de.Message

    } finally {
      _selectedServiceAA = avs.getAddressServiceName()
    }

  }

  public function testAddressVerification() {

    avs = new AddressValidationAPI_ACC()
    _verificationResult = ""

    try {

      var result = avs.getAddressMetadata_ACC(_fullAddress)
      _verificationResult = result.toString(false, "\n")

    } catch (de: DisplayableException) {
      _verificationResult = "Exception error : " + de.Message

    } finally {
      _selectedServiceAV = avs.getAddressServiceName()
    }

  }


}
