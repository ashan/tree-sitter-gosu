package edge.capabilities.gpa.policy.dto

uses edge.aspects.validation.annotations.Required
uses edge.jsonmapper.JsonProperty

class PolicyLineDTO {

  // Language independent LOB Identifier
  @JsonProperty ()
  var _lineOfBusinessCode : String as LineOfBusinessCode

  // Localized LOB Name
  @JsonProperty ()
  var _lineOfBusinessName : String as LineOfBusinessName

  @JsonProperty
  var _eraIndicator : Boolean as ERAIndicator

  @JsonProperty
  var _eraContractNumber : String as ERAContractNumber

  @JsonProperty
  var _eraChangedDate : Date as ERAChangedDate
}
