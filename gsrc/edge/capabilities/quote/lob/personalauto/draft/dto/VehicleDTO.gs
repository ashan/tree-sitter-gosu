package edge.capabilities.quote.lob.personalauto.draft.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses edge.capabilities.currency.dto.AmountDTO
uses java.lang.Integer
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.el.Expr
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.Augment

/**
 * Information about one vehicle.
 */
class VehicleDTO {
  
  @JsonProperty
  var _publicID : String as PublicID
  
  @JsonProperty
  var _tempId : String as TempId

  @JsonProperty @Required
  var _license : String as License

  @JsonProperty @Required
  var _year : int as Year
  
  @JsonProperty @Required
  var _make : String as Make
  
  @JsonProperty @Required
  var _model : String as Model
  
  @JsonProperty @Required
  var _vin : String as Vin
  
  @JsonProperty
  var _annualMileage : Integer as AnnualMileage
  
  @JsonProperty
  var _leaseOrRent : Boolean as LeaseOrRent
  
  @JsonProperty
  var _lengthOfLease : typekey.LengthOfLease as LengthOfLease  
  
  @JsonProperty  
  var _commutingMiles : Integer as CommutingMiles
  
  @JsonProperty
  var _primaryUse : typekey.VehiclePrimaryUse as PrimaryUse
  
  //Added for PC7 Upgrade
  @JsonProperty @Required
  @FilterByCategory(Expr.call(ValidationFunctions#getContextValue(edge.aspects.validation.context.ContextAspect, String),{Validation.CONTEXT,"policyCountry"}))
  var _licenseState : typekey.State as LicenseState
  
  @JsonProperty @Required
  @Augment({"Amount"}, {new Required()})
  var _costNew : AmountDTO as CostNew

  @JsonProperty
  var _displayName : String as DisplayName
}
