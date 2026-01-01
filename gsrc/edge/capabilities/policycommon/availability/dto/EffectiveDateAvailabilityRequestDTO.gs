package edge.capabilities.policycommon.availability.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses java.util.Date

class EffectiveDateAvailabilityRequestDTO {

  @JsonProperty @Required
  var _productCode : String as ProductCode

  @JsonProperty @Required
  var _effectiveDate : Date as EffectiveDate

  construct(){}
}
