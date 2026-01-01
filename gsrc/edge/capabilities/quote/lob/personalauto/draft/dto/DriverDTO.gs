package edge.capabilities.quote.lob.personalauto.draft.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.quote.person.dto.PersonDTO
uses edge.aspects.validation.annotations.Augment
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.el.Expr
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.Pattern
uses edge.jsonmapper.JsonReadOnlyProperty
uses edge.aspects.validation.annotations.NotSet
uses edge.time.LocalDateDTO

/**
 * Information about one driver.
 */
class DriverDTO { 
  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _tempID : String as TempID

  @JsonProperty
  @Augment({"FirstName", "LastName"}, {new Required()})
  @Augment({"Prefix", "MiddleName", "Suffix"}, {new NotSet()})
  var _person : PersonDTO as Person
  
  @JsonProperty @Required
  var _yearLicensed : int as YearLicensed
  
  @JsonProperty @Required
  var _numberOfAccidents : typekey.NumberOfAccidents as Accidents

  @JsonProperty @Required
  var _numberOfViolations : typekey.NumberOfAccidents as Violations

  @JsonProperty @Required
  @FilterByCategory(Expr.call(ValidationFunctions#getContextValue(edge.aspects.validation.context.ContextAspect, String),{Validation.CONTEXT,"policyCountry"}))
  var _licenseState : typekey.Jurisdiction as LicenseState
  
  @JsonProperty @Required @Pattern("^[a-zA-Z0-9]+$", "Edge.Web.Api.PolicyHandler.LicenseNumber")
  var _licenseNumber : String as LicenseNumber

  @JsonProperty @Required
  var _dateOfBirth : LocalDateDTO as DateOfBirth

  @JsonProperty
  var _gender : typekey.GenderType as Gender

  @JsonReadOnlyProperty
  var _isPolicyHolder : boolean  as isPolicyHolder
}
