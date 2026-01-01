package edge.capabilities.gpa.product

uses edge.capabilities.gpa.policy.dto.PolicyDTO
uses edge.capabilities.gpa.product.dto.ProductDTO
uses edge.di.annotations.ForAllGwNodes
uses gw.api.productmodel.Product

class DefaultProductPlugin implements IProductPlugin {

  @ForAllGwNodes
  construct(){}

  override function toDTO(aProduct: Product): ProductDTO {
    var dto = new ProductDTO()
    dto.ProductName = aProduct.Name
    dto.PublicID = aProduct.PublicID
    return dto
  }
}
