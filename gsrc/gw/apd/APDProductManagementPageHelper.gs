package gw.apd

uses gw.api.database.IQuery
uses gw.api.productmodel.Product

@Export
class APDProductManagementPageHelper {

  //------------------------ Helper functions ------------------------
  public static function getApdManagedProducts() : ProductManagementDisplayWrapper[] {
    var apdProducts = gw.api.database.Query.make(APDProduct).select()
    var products = gw.api.productmodel.ProductLookup.getAll().where(\product -> product.ApdManaged)
    var allProductsMap = new HashMap<String, ProductManagementDisplayWrapper>()

    apdProducts.each(\product -> allProductsMap.put(product.CodeIdentifier, new ProductManagementAPDProductWrapper(product)))
    for (product in products) {
      // checking for case if apdProduct template loaded for an apdManaged Installed product
      if (allProductsMap.containsKey(product.CodeIdentifier)) {
        allProductsMap.get(product.CodeIdentifier).Installed = true
      } else {
        allProductsMap.put(product.CodeIdentifier, new ProductManagementConcreteProductWrapper(product))
      }
    }

    return allProductsMap.Values.toTypedArray()
  }

  public static function getExternalManagedProducts(apdManagedValue : boolean) : gw.api.productmodel.Product[] {
    var findProduct = gw.api.productmodel.ProductLookup.getByCodeIdentifier("Manual");
    var products = gw.api.productmodel.ProductLookup.getAll()
        .where(\product -> product.ApdManaged == apdManagedValue)
        .subtract({findProduct})
        .toTypedArray()

    return products
  }

  //------------------------ Wrapper Classes ------------------------
  interface ProductManagementDisplayWrapper {
    property get Abbreviation() : String

    property get CodeIdentifier() : String

    property get Description() : String

    property get Name() : String

    property get DateInstalled() : Date

    property get DateUpdated() : Date

    property get Visualized() : boolean

    property get Installed() : boolean

    property set Installed(arg : boolean)

    public function getSubmissions() : gw.api.database.IQueryBeanResult<Submission>

    public function getInstalledProduct() : Product
  }

  public static class ProductManagementAPDProductWrapper implements ProductManagementDisplayWrapper {
    private final var _product : APDProduct
    private var _installed : boolean

    construct(product : APDProduct) {
      _product = product
      _installed = false
    }

    property get Abbreviation() : String {
      return _product.Abbreviation
    }

    property get CodeIdentifier() : String {
      return _product.CodeIdentifier
    }

    property get Description() : String {
      return _product.Description
    }

    property get Name() : String {
      return _product.Name
    }

    property get DateInstalled() : Date {
      return _product.DateInstalled
    }

    property get DateUpdated() : Date {
      return _product.DateUpdated
    }

    property get Visualized() : boolean {
      return true
    }

    property get Installed() : boolean {
      return _installed
    }

    property get APDProductMetadata() : APDProduct {
      return _product
    }

    property set Installed(arg : boolean) {
      _installed = arg
    }

    override function getSubmissions() : gw.api.database.IQueryBeanResult<Submission> {
      if (!this.Installed) {
        return gw.api.database.Query.make(Submission).join(Submission#Policy).compare(Policy#APDProduct, gw.api.database.Relop.Equals, (this as ProductManagementAPDProductWrapper).APDProductMetadata).select()
      } else {
        var product = gw.api.productmodel.ProductLookup.getByCodeIdentifier(this.CodeIdentifier)
        return gw.api.database.Query.make(Submission).join(Submission#Policy).compare(Policy#ProductCode, gw.api.database.Relop.Equals, product.PublicID).select()
      }
    }

    override function getInstalledProduct() : Product {
      if (this.Visualized and this.Installed) {
        return gw.api.productmodel.ProductLookup.getByCodeIdentifier(this.CodeIdentifier)
      } else {
        return null
      }
    }

    public function equals(other : Object) : boolean {
      if (other typeis ProductManagementAPDProductWrapper) {
        var otherCodeIdentifier : String
        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          var otherProduct = bundle.add(other.APDProductMetadata)
          otherCodeIdentifier = otherProduct.CodeIdentifier
        })
        return this.CodeIdentifier == otherCodeIdentifier
      } else return false
    }
  }

  public static class ProductManagementConcreteProductWrapper implements ProductManagementDisplayWrapper {
    private final var _product : Product;

    construct(product : Product) {
      _product = product
    }

    property get Abbreviation() : String {
      return _product.Abbreviation
    }

    property get CodeIdentifier() : String {
      return _product.CodeIdentifier
    }

    property get Description() : String {
      return _product.Description
    }

    property get Name() : String {
      return _product.Name
    }

    property get DateInstalled() : Date {
      return null
    }

    property get DateUpdated() : Date {
      return null
    }

    property get Visualized() : boolean {
      return false
    }

    property get Installed() : boolean {
      return true
    }

    property set Installed(arg : boolean) {
      throw new UnsupportedOperationException()
    }

    property get ProductMetadata() : Product {
      return _product
    }

    override function getSubmissions() : gw.api.database.IQueryBeanResult<Submission> {
      return gw.api.database.Query.make(Submission).join(Submission#Policy).compare(Policy#ProductCode, gw.api.database.Relop.Equals, (this as ProductManagementConcreteProductWrapper).ProductMetadata.PublicID).select()
    }

    override function getInstalledProduct() : Product {
      return this.ProductMetadata
    }

    public function equals(other : Object) : boolean {
      if (other typeis ProductManagementConcreteProductWrapper ) {
        return this.CodeIdentifier == other.CodeIdentifier
      } else return false
    }
  }
}