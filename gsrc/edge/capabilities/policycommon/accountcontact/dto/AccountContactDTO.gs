package edge.capabilities.policycommon.accountcontact.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Email
uses edge.aspects.validation.Validation
uses edge.el.Expr
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Phone
uses edge.time.LocalDateDTO
uses edge.jsonmapper.JsonReadOnlyProperty
uses java.lang.Integer
uses edge.capabilities.address.dto.AddressDTO
uses edge.aspects.validation.annotations.Augment

/**
 * This DTO represents the account holder for a given account.
*/
class AccountContactDTO {

  //Contact Fields
  @JsonProperty @Size(0, 60) @Email
  @Required(Expr.eq(Validation.getContext("AccountEmailRequired"), true))
  var _emailAddress1 : String as EmailAddress1

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _tempID : Integer as TempID

  @JsonReadOnlyProperty// ReadOnly
  var _displayName : String as DisplayName

  @JsonProperty
  var _primaryContactName : String as PrimaryContactName

  @JsonProperty
  var _primaryPhoneType : typekey.PrimaryPhoneType as PrimaryPhoneType

  @Required(Expr.eq(Expr.getProperty("PrimaryPhoneType", Validation.PARENT),PrimaryPhoneType.TC_HOME))
  @JsonProperty @Size(0, 30) @Phone
  var _homeNumber : String as HomeNumber

  @JsonProperty @Size(0, 30) @Phone
  var _workNumber : String as WorkNumber

  @JsonProperty @Size(0, 30) @Phone
  var _faxNumber : String as FaxNumber

  @JsonProperty @Size(0, 60)
  @Required(Expr.eq(Validation.getParentProperty("Subtype"), "Company"))
  var _contactName : String as ContactName

  @JsonProperty @Size(0, 60)
  var _contactNameKanji : String as ContactNameKanji

  @JsonProperty
  var _subtype : String as Subtype

  @JsonProperty
  @Augment({"AddressLine1","PostalCode"}, {new Required()})
  var _primaryAddress : AddressDTO as PrimaryAddress

  @JsonProperty
  @Required(Expr.eq(Validation.getContext("ProducerCodeRequired"), true))
  var _producerCode : String as ProducerCode

  @JsonProperty
  var _accountHolder : Boolean as AccountHolder

  @JsonProperty
  var _markedForDelete : Boolean as MarkedForDelete

  /*
  Person Fields
   */

  @JsonProperty @Size(0, 30) @Phone
  var _cellNumber : String as CellNumber

  @JsonProperty
  var _dateOfBirth : LocalDateDTO as DateOfBirth

  @JsonProperty
  var _gender : typekey.GenderType as Gender

  @JsonProperty @Size(0, 30)
  @Required(Expr.eq(Validation.getParentProperty("Subtype"), "Person"))
  var _firstName : String as FirstName

  @JsonProperty @Size(0, 30)
  var _firstNameKanji : String as FirstNameKanji

  @JsonProperty @Size(0, 30)
  @Required(Expr.eq(Validation.getParentProperty("Subtype"), "Person"))
  var _lastName : String as LastName

  @JsonProperty @Size(0, 30)
  var _lastNameKanji : String as LastNameKanji

  @JsonProperty @Size(0, 30)
  var _middleName : String as MiddleName

  @JsonProperty
  var _prefix : typekey.NamePrefix as Prefix

  @JsonProperty
  var _suffix : typekey.NameSuffix as Suffix

  @JsonProperty @Size(0, 30)
  var _particle : String as Particle

  @JsonProperty
  protected var _licenseNumber : String as LicenseNumber

  @JsonProperty
  protected var _licenseState : typekey.Jurisdiction as LicenseState

  @JsonProperty
  var _maritalStatus : typekey.MaritalStatus as MaritalStatus
}
