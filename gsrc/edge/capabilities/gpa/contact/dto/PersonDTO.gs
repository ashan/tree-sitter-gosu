package edge.capabilities.gpa.contact.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses java.util.Date
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Email
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.Phone

class PersonDTO extends ContactBaseDTO{

  @JsonProperty
  protected var _licenseNumber : String as LicenseNumber

  @JsonProperty
  protected var _licenseState : typekey.Jurisdiction as LicenseState

  @JsonProperty
  protected var _dateOfBirth : Date as DateOfBirth

  @JsonProperty
  var _suffix : typekey.NameSuffix as Suffix

  @JsonProperty
  var _prefix : typekey.NamePrefix as Prefix

  @JsonProperty
  var _gender : typekey.GenderType as Gender

  @JsonProperty
  var _maritalStatus : typekey.MaritalStatus as MaritalStatus

  @JsonProperty
  var _accountHolder : Boolean as AccountHolder

  @JsonProperty
  var _markedForDelete : Boolean as MarkedForDelete

  @JsonProperty @Required @Size(0, 30)
  var _firstName : String as FirstName

  @JsonProperty @Required @Size(0, 30)
  var _lastName : String as LastName

  @JsonProperty @Size(0, 30)
  var _middleName : String as MiddleName

  @JsonProperty @Size(0, 30)
  var _firstNameKanji : String as FirstNameKanji

  @JsonProperty @Size(0, 30)
  var _lastNameKanji : String as LastNameKanji

  @JsonProperty @Size(0, 60) @Email @Required(Expr.eq(true,Expr.getProperty("AccountHolder",Validation.PARENT)))
  var _emailAddress1 : String as EmailAddress1

  @JsonProperty @Size(0, 30) @Phone
  var _cellNumber : String as CellNumber

}
