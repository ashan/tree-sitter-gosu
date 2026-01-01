package edge.capabilities.vehicleinfo.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer

/*
* Result of a vehicle look up using Year and/or Make
 */
class VehicleInfoLookupResultsDTO {

  @JsonProperty
  var _errorCode : String as ErrorCode

  @JsonProperty
  var _errorDescription : String as ErrorDescription

  @JsonProperty
  var _years : Integer[] as Years

  @JsonProperty
  var _makes : String[] as Makes

  @JsonProperty
  var _models : String[] as Models

}
