package edge.capabilities.profileinfo.producer.dto

uses edge.aspects.validation.annotations.PhoneNumberPresent
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.address.dto.AddressDTO
uses edge.aspects.validation.annotations.Email

@PhoneNumberPresent
class ProducerSummaryDTO {

  @JsonProperty
  var _displayName : String as displayName

  @JsonProperty
  var _primaryAddress : AddressDTO as primaryAddress

  @JsonProperty
  var _phoneNumber : String as phoneNumber

  @JsonProperty @Email
  var _email : String as email

  @JsonProperty
  var _publicID : String as publicID

  construct() {}
}
