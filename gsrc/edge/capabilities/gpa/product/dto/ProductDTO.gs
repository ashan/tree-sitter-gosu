package edge.capabilities.gpa.product.dto
uses edge.jsonmapper.JsonProperty

class ProductDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _product : String as ProductName

}
