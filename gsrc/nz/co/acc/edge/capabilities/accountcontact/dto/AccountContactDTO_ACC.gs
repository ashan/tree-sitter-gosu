package nz.co.acc.edge.capabilities.accountcontact.dto

uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.Augment
uses edge.aspects.validation.annotations.Email
uses edge.aspects.validation.annotations.Phone
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size
uses edge.el.Expr
uses edge.jsonmapper.JsonProperty
uses edge.jsonmapper.JsonReadOnlyProperty
uses nz.co.acc.edge.capabilities.address.dto.AddressDTO_ACC
uses nz.co.acc.edge.time.LocalDateDTO_ACC

/**
 * This DTO represents the account holder for a given account.
 */
class AccountContactDTO_ACC {

  //Contact Fields
  @JsonProperty
  @Size(0, 60)
  @Email
  @Required(Expr.eq(Validation.getContext("AccountEmailRequired"), true))
  var _emailAddress1: String as EmailAddress1

  @JsonProperty
  var _publicID: String as PublicID

  @JsonProperty
  var _tempID: Integer as TempID

  @JsonReadOnlyProperty
  var _displayName: String as DisplayName

  @JsonProperty
  var _primaryContactName: String as PrimaryContactName

  @JsonProperty
  var _primaryPhoneType: PrimaryPhoneType as PrimaryPhoneType

  //@Required(Expr.eq(Expr.getProperty("PrimaryPhoneType", Validation.PARENT),PrimaryPhoneType.TC_HOME))
  @JsonProperty @Size(0, 30) @Phone
  var _homeNumber : String as HomeNumber

  //@Required(Expr.eq(Expr.getProperty("PrimaryPhoneType", Validation.PARENT),PrimaryPhoneType.TC_WORK))
  @JsonProperty @Size(0, 30) @Phone
  var _workNumber : String as WorkNumber

  //@Required(Expr.eq(Expr.getProperty("PrimaryPhoneType", Validation.PARENT),PrimaryPhoneType.TC_MOBILE))
  @JsonProperty @Size(0, 30) @Phone
  var _mobileNumber : String as MobileNumber

  //@Required(Expr.eq(Expr.getProperty("PrimaryPhoneType", Validation.PARENT), PrimaryPhoneType.TC_HOME))
  @JsonProperty
  var _homeNumberV2: PhoneDTO_ACC as HomeNumberV2

  //@Required(Expr.eq(Expr.getProperty("PrimaryPhoneType", Validation.PARENT), PrimaryPhoneType.TC_WORK))
  @JsonProperty
  var _workNumberV2: PhoneDTO_ACC as WorkNumberV2

  //@Required(Expr.eq(Expr.getProperty("PrimaryPhoneType", Validation.PARENT), PrimaryPhoneType.TC_MOBILE))
  @JsonProperty
  var _mobileNumberV2: PhoneDTO_ACC as MobileNumberV2

  @JsonProperty
  @Size(0, 60)
  @Required(Expr.eq(Validation.getParentProperty("Subtype"), "Company"))
  var _contactName: String as ContactName

  @JsonProperty
  @Size(0, 60)
  var _contactNameKanji: String as ContactNameKanji

  @JsonProperty
  var _subtype: String as Subtype

  @JsonProperty
  @Augment({"AddressLine1"}, {new Required()})
  var _primaryAddress: AddressDTO_ACC as PrimaryAddress

  @JsonProperty
  var _addresses: List<AddressDTO_ACC>as Addresses

  @JsonProperty
  @Required(Expr.eq(Validation.getContext("ProducerCodeRequired"), true))
  var _producerCode: String as ProducerCode

  @JsonProperty
  var _accountHolder: Boolean as AccountHolder

  @JsonProperty
  var _markedForDelete: Boolean as MarkedForDelete

  /*
  Person Fields
   */

  @JsonProperty
  var _dateOfBirth: LocalDateDTO_ACC as DateOfBirth

  @JsonProperty
  var _gender: GenderType as Gender

  @JsonProperty
  @Size(0, 30)
  @Required(Expr.eq(Validation.getParentProperty("Subtype"), "Person"))
  var _firstName: String as FirstName

  @JsonProperty
  @Size(0, 30)
  var _firstNameKanji: String as FirstNameKanji

  @JsonProperty
  @Size(0, 30)
  @Required(Expr.eq(Validation.getParentProperty("Subtype"), "Person"))
  var _lastName: String as LastName

  @JsonProperty
  @Size(0, 30)
  var _lastNameKanji: String as LastNameKanji

  @JsonProperty
  @Size(0, 30)
  var _middleName: String as MiddleName

  @JsonProperty
  var _prefix: NamePrefix as Prefix

  @JsonProperty
  var _suffix: NameSuffix as Suffix

  @JsonProperty
  @Size(0, 30)
  var _particle: String as Particle

  @JsonProperty
  protected var _licenseNumber: String as LicenseNumber

  @JsonProperty
  protected var _licenseState: Jurisdiction as LicenseState

  @JsonProperty
  var _maritalStatus: MaritalStatus as MaritalStatus

  @JsonProperty
  var _emailVerifiedDate : Date as EmailVerifiedDate

  @JsonProperty
  @Required
  var _correspondencePreference : CorrespondencePreference_ACC as CorrespondencePreference

  @JsonProperty
  var _isPrimary : Boolean as IsPrimary

  @JsonProperty
  var _irEmailAddress : String as IREmailAddress

  @JsonProperty
  var _irCellPhone_ACC : String as IRCellPhone

  @JsonProperty
  var _contactType : String as ContactType

  @JsonProperty
  var _roles : String[] as Roles

  @JsonProperty
  var _accid : String as ACCID

  @JsonProperty
  var _claimsEmailAddress: String as ClaimsEmailAddress

  @JsonProperty
  var _claimsEmailVerifiedDate : Date as ClaimsEmailVerifiedDate

  public property get hasV2PhoneFields(): Boolean {
    return HomeNumberV2.isDefined || WorkNumberV2.isDefined || MobileNumberV2.isDefined
  }
}
