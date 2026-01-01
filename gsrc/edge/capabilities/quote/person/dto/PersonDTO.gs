package edge.capabilities.quote.person.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer
uses edge.jsonmapper.JsonReadOnlyProperty
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Phone
uses edge.aspects.validation.annotations.Required
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses edge.time.LocalDateDTO

/**
 * Information about particular person.
 */
class PersonDTO {
  @JsonProperty  
  var _publicID : String as PublicID

  @JsonProperty
  var _tempID : Integer as TempID

  @JsonReadOnlyProperty// ReadOnly
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

  @JsonProperty @Size(0, 30)
  var _particle : String as Particle

  @JsonProperty
  var _primaryPhoneType : typekey.PrimaryPhoneType as PrimaryPhoneType

  @Required(Expr.eq(Expr.getProperty("PrimaryPhoneType", Validation.PARENT),PrimaryPhoneType.TC_HOME))
  @JsonProperty @Size(0, 30) @Phone
  var _homeNumber : String as HomeNumber
  
  @JsonProperty @Size(0, 30) @Phone
  var _workNumber : String as WorkNumber
   
  @JsonProperty @Size(0, 30) @Phone
  var _cellNumber : String as CellNumber
  
  @JsonProperty
  var _maritalStatus : typekey.MaritalStatus as MaritalStatus

  @JsonProperty
  var _dateOfBirth : LocalDateDTO as DateOfBirth
}
