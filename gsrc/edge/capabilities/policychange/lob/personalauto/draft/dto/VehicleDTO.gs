package edge.capabilities.policychange.lob.personalauto.draft.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.currency.dto.AmountDTO
uses java.lang.Integer
uses java.lang.Long
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Augment
uses edge.el.Expr
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.FilterByCategory


/**
 * This class represents a PersonalVehicle in the Edge frontend. Note that: <br>
 * When a new vehicle is created, it gets the same coverages as the main vehicle in the policy (the vehicle with the lowest vehicle number) <br>
 * When a vehicle is replaced, it gets the same coverages as the vehicle being replaced, and the drivers assigned to the old vehicle will be assigned to the new one (with the same percentage driven).
 */
class VehicleDTO {

  /** The fixed id identifying this vehicle in every policy period. null for new vehicles. */
  @JsonProperty
  var _fixedId : Long as FixedId

  /** The number of this PersonalVehicle in the policy */
  @JsonProperty
  var _vehicleNumber : Integer as VehicleNumber

  /** A temporary ID assigned to new vehicles so that they can be referenced by other DTOs in the graph. e.g. VehicleDriversDTO */
  @JsonProperty
  var _tempID : Integer as TempID

  /** Read-only. A description for this vehicle. */
  @JsonProperty
  var _displayName : String as DisplayName

  /** The registration number for this vehicle. */
  @JsonProperty
  var _license : String as License

  @JsonProperty @Required
  var _year : int as Year

  @JsonProperty @Required
  var _make : String as Make

  @JsonProperty @Required
  var _model : String as Model

  @JsonProperty @Required
  var _vin : String as Vin

  /** Vehicle's license state. It must be a state in the same country as the policy address. */
  @JsonProperty @Required
  @FilterByCategory(Expr.call(ValidationFunctions#getContextValue(edge.aspects.validation.context.ContextAspect, String),{Validation.CONTEXT,"policyCountry"}))
  var _licenseState : typekey.State as LicenseState

  /** This vehicle's cost */
  @JsonProperty @Required
  @Augment({"Amount"}, {new Required()})
  var _costNew : AmountDTO as CostNew
}
