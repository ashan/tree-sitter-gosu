package edge.capabilities.user.dto

uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Pattern
uses edge.capabilities.address.dto.AddressDTO

class UserDTO {

  @JsonProperty
  var _displayName: String as DisplayName

  @JsonProperty
  var _firstName: String as FirstName

  @JsonProperty
  var _lastName: String as LastName

  @JsonProperty
  var _publicID: String as PublicID

  @JsonProperty @Size(0, 60)
  @Pattern(".+@.+")
  var _email:String as Email

  @JsonProperty @Size(0, 30)
  @Pattern("[0-9]{3}-[0-9]{3}-[0-9]{4}( x[0-9]{0,4})? ")
  var _phoneNumber:String as PhoneNumber

  @JsonProperty
  var _primaryAddress : AddressDTO as PrimaryAddress

  @JsonProperty
  var _userType : String as UserType
}
