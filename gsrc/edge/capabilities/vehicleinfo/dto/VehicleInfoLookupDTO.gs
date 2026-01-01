package edge.capabilities.vehicleinfo.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer

class VehicleInfoLookupDTO {
  @JsonProperty
  var _year : Integer as Year

  @JsonProperty
  var _make : String as Make
  
  @JsonProperty
  var _model : String as Model
  
  @JsonProperty  
  var _body : String as Body
  
}
