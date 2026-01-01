package nz.co.acc.plm.integration.validation.addressvalidation.addressfinder

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.lang.reflect.Expando
uses gw.lang.reflect.json.Json
uses gw.util.GosuStringUtil

uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses nz.co.acc.plm.integration.validation.addressvalidation.AddressMetadata_ACC
uses nz.co.acc.plm.integration.validation.addressvalidation.MatchingAddress_ACC
uses nz.co.acc.plm.integration.http.HTTPConnectionPool
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.util.EntityUtils

uses java.lang.invoke.MethodHandles
uses java.net.URL

/**
 * This is a client for the AddressFinder service (https://addressfinder.nz/)
 * which provides autocomplete and validation functionality for New Zealand addresses
 * <p>
 * Mock service project for Soaup UI is available in Common repository
 */
public class AddressFinderClient_ACC {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  var _autocompleteEndpoint : String
  var _verificationEndpoint : String

  construct(autocompleteEndpoint : String, verificationEndpoint : String) {
    this._autocompleteEndpoint = autocompleteEndpoint
    this._verificationEndpoint = verificationEndpoint
  }

  /**
   * Returns an array of matching addresses from the autocomplete functionality of AddressFinder service.
   * Each item of the array contains all the information as returned by AddressFinder service.
   * The array is empty in case of no matches found or errors.
   *
   * @param partialAddress partial address to use for the autocomplete functionality
   * @return arrays of matching addresses.
   */
  public function invokeAddressAutocomplete_ACC(partialAddress : String) : MatchingAddress_ACC[] {

    if (GosuStringUtil.isBlank(partialAddress)) {
      _log.debug("Partial address parameter is empty")
      return new MatchingAddress_ACC[]{}
    }

    var resultList = new ArrayList<MatchingAddress_ACC>()
    var urlParameters : Dynamic = new Expando()

    urlParameters.format = "json"  //this client has been implemented to read only JSON responses.
    urlParameters.q = partialAddress
    urlParameters.key = ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_KEY.PropertyValue
    urlParameters.secret = ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_SECRET.PropertyValue
    urlParameters.domain = ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_DOMAIN.PropertyValue

    addUrlParameter(urlParameters, "delivered", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_DELIVERED.PropertyValue)
    addUrlParameter(urlParameters, "post_box", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_POSTBOX.PropertyValue)
    addUrlParameter(urlParameters, "rural", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_RURAL.PropertyValue)
    addUrlParameter(urlParameters, "region_code", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_REGIONCODE.PropertyValue)
    addUrlParameter(urlParameters, "strict", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_STRICT.PropertyValue)
    addUrlParameter(urlParameters, "max", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_MAX.PropertyValue)
    addUrlParameter(urlParameters, "highlights", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_HIGHLIGHTS.PropertyValue)
    addUrlParameter(urlParameters, "callback", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_CALLBACK.PropertyValue)

    var url = URL.makeUrl(_autocompleteEndpoint, urlParameters)

    try {
      _log.debug("Calling AddressFinder Autocomplete API: ${url}")

      var httpClient = HTTPConnectionPool.getInstance().Client;
      var httpGet = new HttpGet(url.toURI());
      var httpResponse = httpClient.execute(httpGet)

      using (httpResponse) {
        var responseBody = EntityUtils.toString(httpResponse.Entity)
        var autocompleteResponse = Json.fromJson(responseBody) as Dynamic

        for (addr in autocompleteResponse.completions) {
          var addrItem = new MatchingAddress_ACC()
          addrItem.Address = addr.a
        /* other attributes from addressfinder are :
         addr.pxid  (internal identifier)
         addr.v   (physical or postal - deprecated attribute )
         */

          resultList.add(addrItem)
        }
      }
      _log.debug("AddressFinder Autocomplete returned ${resultList.size()} matching addresses")

    } catch (e : Exception) {
      _log.error_ACC("AddressFinder Autocomplete - Exception: ${e.Message}")

     /* CortesS Note on the exception: the CoreUrlEnhancement.JsonContent below returns exception in case of http status diffent form 200.
       In that case,  using the CoreUrlEnhancement of the gosu core api library, the HTTP response content is not readable
       and therefore is not possible to retrieve the Json content of the response  which contains the error code and message.
       For this reason the code is throwing a generic exception and no details are provided about the web service error.
      */
      throw new DisplayableException(DisplayKey.get("AddressValidationService.Error.GenericCommunicationError_ACC"))

    }

    return resultList.toTypedArray()
  }

  /**
   * Returns an object of Dynamic type which contains the address metadata returned by the Verification functionality of AddressFinder service.
   * The information includes a flag which specifies if the address is valid.
   *
   * @param addressInput address to be verified
   * @return object with a matched flag and several metadata
   */
  public function invokeAddressVerification_ACC(addressInput : String) : AddressMetadata_ACC {

    var addressMetadata = new AddressMetadata_ACC()

    if (GosuStringUtil.isBlank(addressInput)) {
      _log.debug("Address parameter is empty")
      return addressMetadata
    }

    var urlParameters : Dynamic = new Expando()
    urlParameters.format = "json" //this client has been implemented to read only JSON responses.
    urlParameters.q = addressInput
    urlParameters.key = ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_KEY.PropertyValue
    urlParameters.secret = ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_SECRET.PropertyValue
    urlParameters.domain = ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_DOMAIN.PropertyValue

    addUrlParameter(urlParameters, "delivered", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_DELIVERED.PropertyValue)
    addUrlParameter(urlParameters, "post_box", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_POSTBOX.PropertyValue)
    addUrlParameter(urlParameters, "rural", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_RURAL.PropertyValue)
    addUrlParameter(urlParameters, "region_code", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_REGIONCODE.PropertyValue)
    addUrlParameter(urlParameters, "callback", ConfigurationProperty.ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_CALLBACK.PropertyValue)

    var url = URL.makeUrl(_verificationEndpoint, urlParameters)

    try {

      _log.debug("Calling Address Verification API: ${url}")

      var httpClient = HTTPConnectionPool.getInstance().Client;
      var httpGet = new HttpGet(url.toURI());
      var httpResponse = httpClient.execute(httpGet)

      using (httpResponse) {
        var responseBody = EntityUtils.toString(httpResponse.Entity)
        var verificationResponse = Json.fromJson(responseBody)

        if (verificationResponse.size() > 0) {
          addressMetadata = this.createAddressMetadata_ACC(verificationResponse)

          //custom address lines decomposition
          generateCustomAddressLines_ACC(addressMetadata)
        }
      }
    } catch (e : DisplayableException) {
      _log.error_ACC("Address Verification API call failed (url: ${url}) : ${e.Message}")
      throw e

    } catch (e : Exception) {
      _log.error_ACC("Address Verification API call failed (url: ${url}) : ${e.Message}")

      /* CortesS Note on the exception: the CoreUrlEnhancement.JsonContent below returns exception in case of http status diffent form 200.
       In that case,  using the CoreUrlEnhancement of the gosu core api library, the HTTP response content is not readable
       and therefore is not possible to retrieve the Json content of the response  which contains the error code and message.
       For this reason the code is throwing a generic exception and no details are provided about the web service error.
      */
      throw new DisplayableException(DisplayKey.get("AddressValidationService.Error.GenericCommunicationError_ACC"))
    }

    return addressMetadata
  }

  /**
   * This method create a new AddressMetadata_ACC object using the information contained
   * in the AddressFinder Verification response
   */
  private function createAddressMetadata_ACC(clientResponse : Dynamic) : AddressMetadata_ACC {

    var ad = new AddressMetadata_ACC()

    try {

      // The following control on the String type has been introduced because in few cases boolean or numeric values are actually returned as text
      ad.Matched = (clientResponse.matched typeis String) ? Boolean.valueOf(clientResponse.matched) : clientResponse.matched
      if (!ad.Matched) {
        return ad
      }

      ad.PhysicalAddress = clientResponse.a
      ad.Alpha = clientResponse.alpha
      ad.BoxType = clientResponse.box_type
      ad.BuildingName = clientResponse.building_name
      ad.City = clientResponse.city
      ad.Dpid = clientResponse.dpid
      ad.Floor = clientResponse.floor
      ad.LobbyName = clientResponse.lobby_name
      ad.Mailtown = clientResponse.mailtown
      ad.Meshblock = clientResponse.meshblock
      ad.Number = clientResponse.number
      ad.PostSuburb = clientResponse.post_suburb
      ad.PostalAddress = clientResponse.postal
      ad.PostalLine1 = clientResponse.postal_line_1
      ad.PostalLine2 = clientResponse.postal_line_2
      ad.PostalLine3 = clientResponse.postal_line_3
      ad.PostalLine4 = clientResponse.postal_line_4
      ad.PostalLine5 = clientResponse.postal_line_5
      ad.PostalLine6 = clientResponse.postal_line_6
      ad.Postcode = clientResponse.postcode
      ad.AddressIdWithinExternalService = clientResponse.pxid
      ad.RuralDeliveryNumber = clientResponse.rd_number
      ad.Region = clientResponse.region
      ad.Street = clientResponse.street
      ad.StreetType = clientResponse.street_type
      ad.Suburb = clientResponse.suburb
      ad.TerritorialAuthority = clientResponse.ta
      ad.UnitIdentifier = clientResponse.unit_identifier
      ad.UnitType = clientResponse.unit_type
      ad.X = (clientResponse.x typeis String) ? clientResponse.x : Double.toString(clientResponse.x)
      ad.Y = (clientResponse.y typeis String) ? clientResponse.y : Double.toString(clientResponse.y)

      // The following controls on the String type has been introduced because in few cases boolean or numeric values are actually returned as text
      ad.Sufi = (clientResponse.sufi typeis String) ? Integer.valueOf(clientResponse.sufi) : clientResponse.sufi
      ad.Rural = (clientResponse.rural typeis String) ? Boolean.valueOf(clientResponse.rural) : clientResponse.rural

    } catch (e : Exception) {
      _log.error_ACC("Exception during conversion from Dynamic object to Address Metadata: " + e)
      throw new DisplayableException(DisplayKey.get("AddressValidationService.Error.Verification.ResponseProcessingError_ACC"))

    }

    return ad
  }

  private function generateCustomAddressLines_ACC(addressMetadata : AddressMetadata_ACC) {

    if (!addressMetadata.Matched) {
      return
    }
    var addressItemsList : ArrayList<String>
    var items : String[]
    var city : String
    var suburb : String

    try {

      // split address string into items
      if (GosuStringUtil.isNotBlank(addressMetadata.PostalAddress)) {
        // postal address
        items = addressMetadata.PostalAddress.split(",")

      } else if (GosuStringUtil.isNotBlank(addressMetadata.PhysicalAddress)) {
        //physical address
        items = addressMetadata.PhysicalAddress.split(",")

      } else {
        throw "Can't find a valid address string in the address's metadata"
      }

      for (var item in items index i) {
        items[i] = item.trim()
      }

      addressItemsList = new ArrayList<String>(items.toList())

      // check if last item of address is city and postcode and extract the city
      city = GosuStringUtil.isNotBlank(addressMetadata.Mailtown) ? addressMetadata.Mailtown : addressMetadata.City
      if (addressItemsList.last().equalsIgnoreCase(city + " " + addressMetadata.Postcode)) {
        addressMetadata.AddressLineCity = city
        addressItemsList.remove(addressItemsList.last())
      }

      // check if the second to last item of the address is the suburb and use it in line3
      suburb = GosuStringUtil.isNotBlank(addressMetadata.PostSuburb) ? addressMetadata.PostSuburb : addressMetadata.Suburb
      if (addressItemsList.last().equalsIgnoreCase(suburb)) {
        addressMetadata.AddressLine3 = addressItemsList.last()
        addressItemsList.remove(addressItemsList.last())
      }

      // check if remaining elements are more than 1 and use the last in line2
      if (addressItemsList.size() > 1) {
        addressMetadata.AddressLine2 = addressItemsList.last()
        addressItemsList.remove(addressItemsList.last())
      }

      // use all the remaining items for line1
      addressMetadata.AddressLine1 = addressItemsList.join(", ")

    } catch (e : Exception) {
      _log.error_ACC("Error while decomposing address into lines", e)
    }

  }


  private function addUrlParameter(urlParameters : Expando, paramName : String, paramValue : String) {
    if (paramValue != null) {
      urlParameters.setFieldValue(paramName, paramValue)
    }

  }


}
