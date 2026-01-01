package edge.capabilities.gpa.product

uses edge.capabilities.gpa.product.dto.ProductDTO
uses gw.api.productmodel.Product

interface IProductPlugin {

  public function toDTO(aProduct : Product) : ProductDTO

}
