package edge.capabilities.quote.draft.dto

uses edge.jsonmapper.JsonProperty

class TrackingCodeDTO {
  @JsonProperty
  var _codeName : String as CodeName

  @JsonProperty
  var _codeValue : String as CodeValue
}
