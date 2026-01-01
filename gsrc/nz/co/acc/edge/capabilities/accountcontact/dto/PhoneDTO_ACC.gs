package nz.co.acc.edge.capabilities.accountcontact.dto

uses edge.aspects.validation.annotations.Phone
uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty

/**
 * Created by OurednM on 28/05/2018.
 */
class PhoneDTO_ACC {

  @JsonProperty
  @Size(2, 2)
  var _countryIsoCode: String as CountryISOCode

  @JsonProperty
  var _countryCode: String as CountryCode

  @JsonProperty
  @Size(0, 30)
  @Phone
  var _phoneNumber: String as PhoneNumber

  @JsonProperty
  var _extensionCode: String as ExtensionCode

  public property get isDefined(): Boolean {
    return PhoneNumber != null
  }

  override public function toString(): String {
    return "PhoneDTO_ACC{" +
        "_countryIsoCode='" + _countryIsoCode + '\'' +
        ",_countryCode='" + _countryCode + '\'' +
        ", _phoneNumber='" + _phoneNumber + '\'' +
        ", _extensionCode='" + _extensionCode + '\'' +
        '}'
  }
}