package nz.co.acc.edge.capabilities.address.dto

uses edge.aspects.validation.annotations.AddressField
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.aspects.validation.annotations.PostalCode
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size
uses edge.capabilities.address.dto.AddressDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.helpers.EdgeConstants_ACC


/**
 * Information about an address.
 */
class AddressDTO_ACC extends AddressDTO {

  /**
   * Public identifier for the address within Insurance Suite
   */
  @JsonProperty
  var _publicID: String as PublicID

  /**
   * Display name for the address
   */
  @JsonProperty
  var _displayName: String as DisplayName

  /**
   * Attention line for the address
   */
  @JsonProperty
  var _attention: String as Attention

  /**
   * First line of the address
   */
  @JsonProperty
  @Size(0, 60)
  @Required
  @AddressField
  var _addressLine1: String as AddressLine1

  /**
   * Kanji representation of the first line of the address
   */
  @JsonProperty
  @Size(0, 60)
  @AddressField
  var _addressLine1Kanji: String as AddressLine1Kanji

  /**
   * Second line of the address
   */
  @JsonProperty
  @Size(0, 60)
  @AddressField
  var _addressLine2: String as AddressLine2

  /**
   * Kanji representation of the second line of the address
   */
  @JsonProperty
  @Size(0, 60)
  @AddressField
  var _addressLine2Kanji: String as AddressLine2Kanji

  /**
   * Third line of the address
   */
  @JsonProperty
  @Size(0, 60)
  @AddressField
  var _addressLine3: String as AddressLine3

  /**
   * City
   */
  @JsonProperty
  @Size(0, 60)
  @AddressField
  var _city: String as City

  /**
   * Kanji representation of the city
   */
  @JsonProperty
  @Size(0, 60)
  var _cityKanji: String as CityKanji

  /**
   * State
   */
  @JsonProperty
  @FilterByCategory("Country")
  @AddressField
  var _state: typekey.State as State

  /**
   * Postal Code
   */
  @JsonProperty
  var _postalCode: String as PostalCode

  /**
   * Country
   */
  @JsonProperty
  @AddressField
  var _country: typekey.Country as Country

  /**
   * Type of the address (e.g. home, work)
   */
  @JsonProperty
  @Required
  var _addressType: AddressType as AddressType

  /**
   * True when city and state are populated based on the postal code.
   * False when the postal code is not used to populate those fields or when the
   * autofill logic can't determine city or state for the postal code.
   */
  @JsonProperty
  var _autofilled: Boolean as IsAutofilled

  /**
   * date until address is valid
   */
  @JsonProperty
  var _isInvalid: Boolean as IsInvalid

  /**
   * Address location type (postal/physical)
   */
  @JsonProperty
  var _addressLocationType: typekey.AddressLocationType_ACC as AddressLocationType

  /**
   * Indicates if set as WPC policy address
   */
  @JsonProperty
  var _isWPCAddress: Boolean as IsWPCAddress

  /**
   * Indicates if set as WPS policy address
   */
  @JsonProperty
  var _isWPSAddress: Boolean as IsWPSAddress

  /**
   * Indicates if set as CP/CX policy address
   */
  @JsonProperty
  var _isCPCXAddress: Boolean as IsCPCXAddress

  /**
   * Indicates if this has been set as a Primary address for its associated Contact
   */
  @JsonProperty
  var _isPrimaryAddress: Boolean as IsPrimaryAddress

  override function toString(): String {
    return "AddressDTO_ACC{" +
        "_publicID='" + _publicID + '\'' +
        ", _displayName='" + _displayName + '\'' +
        ", _attention='" + _attention + '\'' +
        ", _addressLine1='" + _addressLine1 + '\'' +
        ", _addressLine1Kanji='" + _addressLine1Kanji + '\'' +
        ", _addressLine2='" + _addressLine2 + '\'' +
        ", _addressLine2Kanji='" + _addressLine2Kanji + '\'' +
        ", _addressLine3='" + _addressLine3 + '\'' +
        ", _city='" + _city + '\'' +
        ", _cityKanji='" + _cityKanji + '\'' +
        ", _state=" + _state +
        ", _postalCode='" + _postalCode + '\'' +
        ", _country=" + _country +
        ", _addressType=" + _addressType +
        ", _autofilled=" + _autofilled +
        ", _isInvalid=" + _isInvalid +
        ", _addressLocationType=" + _addressLocationType +
        ", _isWPCAddress=" + _isWPCAddress +
        ", _isWPSAddress=" + _isWPSAddress +
        ", _isCPCXAddress=" + _isCPCXAddress +
        ", _isPrimaryAddress=" + _isPrimaryAddress +
        '}'
  }

  override function equals(object : Object) : boolean {
    var dto = object as AddressDTO_ACC
    var dtoIsEqual = this.AddressLine1 == dto.AddressLine1
            and this.AddressLine2 == dto.AddressLine2
            and this.AddressLine3 == dto.AddressLine3
            and this.AddressType == dto.AddressType
            and this.City == dto.City
            and this.PostalCode == dto.PostalCode
            and this.Country == dto.Country
            and this.IsWPSAddress == dto.IsWPSAddress
            and this.IsWPCAddress == dto.IsWPCAddress
            and this.IsCPCXAddress == dto.IsCPCXAddress
    return dtoIsEqual
  }

  construct() {
  }
}
