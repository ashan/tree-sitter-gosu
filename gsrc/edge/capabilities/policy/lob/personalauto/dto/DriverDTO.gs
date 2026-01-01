package edge.capabilities.policy.lob.personalauto.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date

final class DriverDTO {
  @JsonProperty
  var _firstName : String as FirstName

  @JsonProperty
  var _lastName : String as LastName

  @JsonProperty
  var _displayName : String as DisplayName

  @JsonProperty
  var _licenseNumber : String as LicenseNumber

  @JsonProperty
  var _licenseState : Jurisdiction as LicenseState

  @JsonProperty
  var _dateOfBirth : Date  as DateOfBirth

  construct() {}

}
