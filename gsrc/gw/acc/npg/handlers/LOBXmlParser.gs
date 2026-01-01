package gw.acc.npg.handlers

uses gw.acc.npg.schema.line_of_business.Product
uses gw.xml.XmlException
uses org.slf4j.LoggerFactory

uses java.io.BufferedInputStream

/**
 * Parser handler for parsing provided lob xml stream to {@link gw.acc.npg.schema.line_of_business.Product}
 */
class LOBXmlParser extends AbstractHandler {

  private static final var LOGGER = LoggerFactory.getLogger(LOBXmlParser)

  /**
   * Handles request for parsing the lob xml stream provided in the {@link gw.acc.npg.handlers.Request}, to
   * {@link gw.acc.npg.schema.line_of_business.Product} model
   *
   * @param req Request carries information required to carried out processing for the handler
   */
  override function handleRequest(req: Request) {
    validateRequest(req)
    try {
      var product = Product.parse(new BufferedInputStream(req.XMLStream))
      req.XMLProductModel = product
    } catch (ex: Exception) {
      var newExeption = new XmlException(ex, "Problem while parsing lob xml. Cause: ${ex.Message}", null)
      logAndThrowException(LOGGER, newExeption)
    }
    _nextHandler?.handleRequest(req)
  }

  private function validateRequest(req: Request) {
    if (req == null) {
      var ex = new IllegalArgumentException("Problem while parsing lob xml. Cause: [req] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
    if (req.XMLStream == null) {
      var ex = new IllegalArgumentException("Problem while parsing lob xml. Cause: [XMLStream] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
  }
}