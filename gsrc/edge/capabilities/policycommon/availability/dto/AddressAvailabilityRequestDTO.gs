package edge.capabilities.policycommon.availability.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date

uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.PostalCode
uses edge.capabilities.address.dto.AddressDTO

class AddressAvailabilityRequestDTO {

  @JsonProperty @Required
  var _address : AddressDTO as Address

  @JsonProperty @Required
  var _productCode : String as ProductCode

  @JsonProperty @Required
  var _effectiveDate : Date as EffectiveDate

  construct(){}
}
