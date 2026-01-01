package nz.co.acc.plm.integration.validation.addressvalidation

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException

uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses nz.co.acc.plm.integration.validation.addressvalidation.addressfinder.AddressFinderClient_ACC
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Service class which provides address validation and autocomplete functionality.
 */
public class AddressValidationAPI_ACC {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  private var _addressValidationClient : AddressFinderClient_ACC
  private var _addressServiceName : String

  private var _autocompleteEndpoint = ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_ENDPOINT.PropertyValue
  private var _verificationEndpoint = ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_ENDPOINT.PropertyValue

  public construct() {
    initializeClient()
  }

  private function initializeClient() {
    _addressServiceName = ConfigurationProperty.ADDRESSVALIDATIONAPI_SELECTEDSERVICE_SERVICENAME.PropertyValue
    if (_addressServiceName == ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_SERVICENAME.PropertyValue) {

      //  AddressFinder client has been selected
      _addressValidationClient = new AddressFinderClient_ACC(
          :autocompleteEndpoint = _autocompleteEndpoint,
          :verificationEndpoint = _verificationEndpoint)

    } else {
      _addressValidationClient = null
      _log.error_ACC("_addressValidationClient can't be initialized - Invalid _addressServiceName :" + _addressServiceName)
    }
  }

  public function withAutocompleteEndpoint(autocompleteEndpoint: String): AddressValidationAPI_ACC {
    _autocompleteEndpoint = autocompleteEndpoint
    initializeClient()
    return this
  }

  public function withVerificationEndpoint(verificationEndpoint: String): AddressValidationAPI_ACC {
    _verificationEndpoint = verificationEndpoint
    initializeClient()
    return this
  }

  public function getAddressServiceName() : String {
    return _addressServiceName
  }

  /**
   * Provides autocomplete functionality for a partial address.
   *
   * @param partialAddress partial address
   * @return arrays of matching addresses.
   * @throws DisplayableException If the Address Validation Web Service response contains an error message
   *                              or in case of communication error with the Web Service
   */
  public function getMatchingAddresses_ACC(partialAddress : String) : MatchingAddress_ACC[] {
    try {
      // It returns an array of MatchingAddress_ACC objects instead of String because of possible future data
      // to be brought from the actual web API client to the PLM application business logic
      return _addressValidationClient.invokeAddressAutocomplete_ACC(partialAddress)

    } catch (e : DisplayableException) {
      _log.error_ACC("Address autocomplete failed : ${e.Message}")
      throw e

    } catch (e : Exception) {
      _log.error_ACC("Address autocomplete failed : ${e.Message}")
      throw new DisplayableException(DisplayKey.get("AddressValidationService.Error.GenericCommunicationError_ACC"))
    }

  }

  /**
   * Provides verification functionality for an address. It returns an object in which the attributes are the metadata
   * returned by the validation service. Attributes which are not returned by the external validation service
   * are not initialized in the returned object. In case of empty fullAddress parameter, returns
   * an AddressMetadata_ACC object with all not initialized attributes.
   *
   * @param partialAddress address
   * @return object with the metadata for the given address
   * @throws DisplayableException If the Address Validation Web Service response contains an error message,
   *                              or if there is a communication error with the Web Service or in case of
   *                              error in the processing of the Web Service response
   */
  public function getAddressMetadata_ACC(fullAddress : String) : AddressMetadata_ACC {

    try {
      return _addressValidationClient.invokeAddressVerification_ACC(fullAddress)

    } catch (e : DisplayableException) {
      _log.error_ACC("Address verification failed : ${e.Message}")
      throw e

    } catch (e : Exception) {
      _log.error_ACC("Address verification failed : ${e.Message}")
      throw new DisplayableException(DisplayKey.get("AddressValidationService.Error.Verification.ResponseProcessingError_ACC"))
    }

  }


}

