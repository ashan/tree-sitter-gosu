package edge.capabilities.gpa.account.search.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.aspects.validation.annotations.AddressField
uses edge.aspects.validation.annotations.PostalCode

class AccountSearchCriteriaDTO {

  @JsonProperty @Required(Expr.eq(Expr.const(ContactType.TC_COMPANY),Expr.getProperty("ContactType",Validation.PARENT)))
  var _contactName: String as ContactName

  @JsonProperty
  var _contactNameKanji : String as ContactNameKanji

  @JsonProperty @Required(Expr.eq(Expr.const(ContactType.TC_PERSON),Expr.getProperty("ContactType",Validation.PARENT)))
  var _lastName: String as LastName

  @JsonProperty
  var _lastNameKanji: String as LastNameKanji

  @JsonProperty @Required(Expr.eq(Expr.const(ContactType.TC_PERSON),Expr.getProperty("ContactType",Validation.PARENT)))
  var _firstName: String as FirstName

  @JsonProperty
  var _firstNameKanji: String as FirstNameKanji

  @JsonProperty @Required
  var _contactType : ContactType as ContactType

  @JsonProperty
  var _city : String as City

  @JsonProperty
  var _cityKanji : String as CityKanji

  @JsonProperty @FilterByCategory("Country")
  @AddressField
  var _state : typekey.State as State

  @JsonProperty
  @AddressField
  var _country : typekey.Country as Country

  @JsonProperty @PostalCode
  var _postalCode: String as PostalCode
}
