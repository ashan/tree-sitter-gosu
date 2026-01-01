package edge.capabilities.policychange.lob.personalauto.draft.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer
uses java.util.Date
uses java.lang.Long
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Pattern
uses edge.capabilities.quote.person.dto.PersonDTO
uses edge.aspects.validation.annotations.Augment
uses edge.aspects.validation.annotations.NotSet
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.el.Expr
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation

/**
 * Represents a PolicyDriver in the Edge frontend. Note that <br>
 * When a driver is repalced, it's assigned to the same vehicles (and with the same percentage) as the old driver.
*/
class DriverDTO {

  /** The fixed id identifying this driver in every policy period. null for new drivers */
  @JsonProperty
  var _fixedId : Long as FixedId

  /** Write-only. The fixed id of the driver being replaced by this one. */
  @JsonProperty
  var _replacedId : Long as ReplacedId

  /** Write-only. A temporary ID assigned to new drivers, so that they can be referenced by other DTOs in the graph. e.g. VehicleDriversDTO */
  @JsonProperty
  var _tempID : String as TempID

  /** Read-only. A description for this driver. */
  @JsonProperty // ReadOnly
  var _displayName : String as DisplayName

  /** Contact information for this driver. If present, it should have non-empty FirstName and LastName */
  @JsonProperty
  @Augment({"FirstName", "LastName"}, {new Required()})
  @Augment({"Prefix", "MiddleName", "Suffix"}, {new NotSet()})
  var _person : PersonDTO as Person

  /** Driver's date of birth */
  @JsonProperty @Required
  var _dateOfBirth : Date as DateOfBirth

  /** Driver's license number */
  @JsonProperty @Required @Pattern("^[a-zA-Z0-9]+$", "Edge.Web.Api.PolicyHandler.LicenseNumber")
  var _licenseNumber : String as LicenseNumber

   /** Driver's license state. It must be a jurisdiction in the same country as the policy address. */
  @JsonProperty @Required
  @FilterByCategory(Expr.call(ValidationFunctions#getContextValue(edge.aspects.validation.context.ContextAspect, String),{Validation.CONTEXT,"policyCountry"}))
  var _licenseState : typekey.Jurisdiction as LicenseState

  /** Year the driver got her license. */
  @JsonProperty @Required
  var _yearLicensed : Integer as YearLicensed

  @JsonProperty @Required
  var _numberOfAccidents : typekey.NumberOfAccidents as Accidents

  @JsonProperty @Required
  var _numberOfViolations : typekey.NumberOfAccidents as Violations

  /** Read-only. 'true' when this driver is the policyholder */
  @JsonProperty
  var _isPolicyHolder : Boolean as isPolicyHolder

  @JsonProperty
  var _gender : typekey.GenderType as Gender
}
