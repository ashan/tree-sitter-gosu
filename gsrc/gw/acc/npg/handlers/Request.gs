package gw.acc.npg.handlers

uses gw.acc.npg.model.ProductLine
uses gw.acc.npg.schema.line_of_business.Product

uses java.io.InputStream

/**
 * Request to carry information with in different {@link gw.acc.npg.handlers.AbstractHandler}.
 * Once a handler execute its work this request will be send to its successor handler to carry
 * out its responsibility.
 */
class Request {

  private var _xmlStream: InputStream as XMLStream
  private var _packageName: String as PackageName
  private var _absoluteAppPath: String as AbsoluteAppPath
  private var _productLine: ProductLine as ProductLine
  private var _xmlProductModel: Product as XMLProductModel


  public static function createBuilder(): RequestBuilder {
    return new RequestBuilder()
  }

  /**
   * Builder for building {@link  gw.acc.npg.handlers.Request} objects
   */
  static class RequestBuilder {

    private var _xmlStream: InputStream
    private var _packageName: String
    private var _productLine: ProductLine
    private var _xmlProductModel: Product
    private var _absoluteAppPath: String

    public function withXMLStream(xmlStream: InputStream): RequestBuilder {
      this._xmlStream = xmlStream
      return this
    }

    public function withXMLProduct(xmlProductModel: Product): RequestBuilder {
      this._xmlProductModel = xmlProductModel
      return this
    }

    public function withProductLine(productLine: ProductLine): RequestBuilder {
      this._productLine = productLine
      return this
    }

    public function withPackageName(packageName: String): RequestBuilder {
      this._packageName = packageName
      return this
    }

    public function withAbsoluteAppPath(absoluteAppPath: String): RequestBuilder {
      this._absoluteAppPath = absoluteAppPath
      return this
    }

    public function build(): Request {
      var req = new Request()
      req.PackageName = _packageName
      req.ProductLine = _productLine
      req.XMLStream = _xmlStream
      req.XMLProductModel = _xmlProductModel
      req.AbsoluteAppPath = _absoluteAppPath
      return req
    }
  }
}