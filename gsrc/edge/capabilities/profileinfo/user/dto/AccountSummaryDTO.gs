package edge.capabilities.profileinfo.user.dto

uses java.lang.String
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.address.dto.AddressDTO
uses edge.aspects.validation.annotations.PhoneNumberPresent
uses edge.aspects.validation.annotations.Phone
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Email
uses edge.time.LocalDateDTO

@PhoneNumberPresent
class AccountSummaryDTO {

  @JsonProperty
  var _accountNumber : String as AccountNumber

  @JsonProperty // ReadOnly
  var _displayName : String as DisplayName

  @JsonProperty @Size(0, 30)
  var _firstName : String as FirstName

  @JsonProperty @Size(0, 30)
  var _middleName : String as MiddleName

  @JsonProperty @Size(0, 30)
  var _firstNameKanji : String as FirstNameKanji

  @JsonProperty @Size(0, 30)
  var _lastName : String as LastName

  @JsonProperty @Size(0, 30)
  var _lastNameKanji : String as LastNameKanji

  @JsonProperty
  var _prefix : typekey.NamePrefix as Prefix

  @JsonProperty
  var _suffix : typekey.NameSuffix as Suffix

  @JsonProperty
  var _primaryAddress : AddressDTO as PrimaryAddress

  @JsonProperty
  var _primaryAddressDisplay : String as PrimaryAddressDisplay

  @JsonProperty
  var _primaryPhoneType : typekey.PrimaryPhoneType as PrimaryPhoneType

  @JsonProperty @Size(0, 30) @Phone
  var _homeNumber : String as HomeNumber

  @JsonProperty @Size(0, 30) @Phone
  var _workNumber : String as WorkNumber

  @JsonProperty @Size(0, 30) @Phone
  var _cellNumber : String as CellNumber

  @JsonProperty @Email
  var _emailAddress1 : String as EmailAddress1

  @JsonProperty
  var _dateOfBirth : LocalDateDTO as DateOfBirth

  construct() {}
}
