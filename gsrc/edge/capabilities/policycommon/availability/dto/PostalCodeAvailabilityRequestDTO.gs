package edge.capabilities.policycommon.availability.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date

uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.PostalCode

class PostalCodeAvailabilityRequestDTO {

  @JsonProperty @Required("Edge.Web.Api.AvailabilityHandler.PostalCode") @PostalCode
  var _postalCode : String as PostalCode

  @JsonProperty @Required
  var _productCode : String as ProductCode

  @JsonProperty @Required
  var _effectiveDate : Date as EffectiveDate

  construct(){}
}
