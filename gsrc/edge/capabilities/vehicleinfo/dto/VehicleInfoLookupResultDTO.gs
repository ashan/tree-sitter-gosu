package edge.capabilities.vehicleinfo.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.currency.dto.AmountDTO
uses java.lang.Integer

class VehicleInfoLookupResultDTO {
  @JsonProperty
  var _year : Integer as Year

  @JsonProperty
  var _make : String as Make
  
  @JsonProperty
  var _model : String as Model
  
  @JsonProperty  
  var _body : String as Body

  @JsonProperty
  var _trim : String as Trim

  @JsonProperty
  var _variant : String as Variant

  @JsonProperty
  var _cost : AmountDTO as Cost

  @JsonProperty
  var _fuelType : String as FuelType

  @JsonProperty
  var _vin : String as Vin

  @JsonProperty
  var _iso1 : String as Iso1

  @JsonProperty
  var _iso2 : String as Iso2

  @JsonProperty
  var _errorCode : String as ErrorCode //This could be a code or string from a given plugin

  @JsonProperty
  var _errorDescription : String as ErrorDescription

}
