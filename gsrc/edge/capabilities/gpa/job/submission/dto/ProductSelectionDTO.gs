package edge.capabilities.gpa.job.submission.dto

uses edge.jsonmapper.JsonProperty

class ProductSelectionDTO {

  @JsonProperty
  var _productName : String as ProductName

  @JsonProperty
  var _productCode : String as ProductCode

  @JsonProperty
  var _status : String as Status

  @JsonProperty
  var _isRiskReserved : Boolean as IsRiskReserved

}
