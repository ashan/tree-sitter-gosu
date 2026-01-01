package gw.acc.npg.handlers

uses gw.acc.npg.exception.HandlerException
uses gw.acc.npg.model.ProductLine
uses gw.acc.npg.templates.productmodel.LookupTables
uses gw.acc.npg.templates.productmodel.PolicyLineLookup
uses gw.acc.npg.templates.productmodel.PolicyLinePattern
uses gw.acc.npg.templates.productmodel.PolicyLineProperties
uses gw.acc.npg.templates.productmodel.Product
uses gw.acc.npg.templates.productmodel.ProductLookup
uses gw.acc.npg.templates.productmodel.ProductModelDisplayProperties
uses gw.util.GosuStringUtil
uses org.slf4j.LoggerFactory

uses java.nio.file.Path

/**
 * Generator handler for generating product model files for provided {@link ProductLine}
 * in {@link Request}
 */
class ProductModelFilesGenerator extends AbstractGeneratorHandler {

  internal static final var RESOURCES: String = "resources"
  internal static final var LOOKUP_TABLES: String = "lookuptables"
  internal static final var PRODUCT_MODEL: String = "productmodel"
  internal static final var POLICY_LINE_PATTERNS: String = "policylinepatterns"
  internal static final var PRODUCTS: String = "products"
  internal static final var LOCALIZATIONS: String = "locale"
  private static final var LOGGER = LoggerFactory.getLogger(ProductModelFilesGenerator)
  private static final var LOOKUP_TABLE_MATCHING_TEXT = "</LookupTables>"
  private var _absoluteAppPath: String

  override function handleRequest(req: Request) {
    validateRequest(req)
    try {
      if (GosuStringUtil.isBlank(req.AbsoluteAppPath)) {
        LOGGER.warn("Application path is not specified. Default path: [{}] will be used.", APPLICATION_PATH)
        req.AbsoluteAppPath = APPLICATION_PATH
      }
      _absoluteAppPath = req.AbsoluteAppPath
      generateFiles(req.ProductLine)
    } catch (ex: HandlerException) {
      var newException = new HandlerException("Problem while generating product model files. ${ex.Message}", ex.getCause())
      logAndThrowException(LOGGER, newException)
    } catch (ex: Exception) {
      var newException = new HandlerException("Problem while generating product model files. Cause: ${ex.Message}", ex)
      logAndThrowException(LOGGER, newException)
    }
    _nextHandler?.handleRequest(req)
  }

  private function validateRequest(req: Request) {
    if (req == null) {
      var ex = new IllegalArgumentException("Problem while generating product model files. Cause: [req] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
    if (req.ProductLine == null) {
      var ex = new IllegalArgumentException("Problem while generating product model files. Cause: [ProductLine] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
  }

  override function generateFiles(productLine: ProductLine) {
    LOGGER.info("Generating product model files in package: [{}]", productLine.LOBPackageName)
    createDirectories(productLine.ProductCode, productLine.LineCode)
    generateProductFiles(productLine)
  }

  private function generateProductFiles(productLine: ProductLine): void {
    insertContents(LookupTables.renderToString(productLine), LOOKUP_TABLE_MATCHING_TEXT, createLookupTablesFilePath(buildFileName(productLine.LookupTablesName)))
    writeContents(PolicyLineLookup.renderToString(productLine), createPolicyLinePatternsFilePath(buildFileName(productLine.PolicyLineLookupsName), productLine.LineCode))
    writeContents(PolicyLinePattern.renderToString(productLine), createPolicyLinePatternsFilePath(buildFileName(productLine.LineCode), productLine.LineCode))
    writeContents(PolicyLineProperties.renderToString(productLine), createPolicyLinePatternsFilePath("${productLine.LineCode}.properies", productLine.LineCode))
    writeContents(Product.renderToString(productLine), createProductModelFilePath(buildFileName(productLine.ProductCode), productLine.ProductCode))
    writeContents(ProductLookup.renderToString(productLine), createProductModelFilePath(buildFileName(productLine.ProductLookupsName), productLine.ProductCode))
    appendContents(ProductModelDisplayProperties.renderToString(productLine), createDisplayPropertyFilePath(productLine.ProductModelDisplayPropertiesName))
  }

  private function createLookupTablesFilePath(fileName: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, LOOKUP_TABLES}, new String[]{}, new String[]{fileName})
  }

  private function createProductModelFilePath(fileName: String, productCode: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, RESOURCES}, new String[]{PRODUCT_MODEL, PRODUCTS, productCode}, new String[]{fileName})
  }

  private function createPolicyLinePatternsFilePath(fileName: String, lineCode: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, RESOURCES}, new String[]{PRODUCT_MODEL, POLICY_LINE_PATTERNS, lineCode}, new String[]{fileName})
  }


  private function createDirectories(productCode: String, lineCode: String) {
    createProductModelDirectory(productCode)
    createPolicyLinePatternDirectory(lineCode)
  }

  function createDisplayPropertyFilePath(fileName: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, LOCALIZATIONS}, new String[]{}, new String[]{fileName})
  }

  private function createProductModelDirectory(productCode: String) {
    var directoryPath = createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, RESOURCES}, new String[]{PRODUCT_MODEL, PRODUCTS, productCode}, new String[]{})
    createDirectoriesIfNotExists(directoryPath)
  }

  private function createPolicyLinePatternDirectory(lineCode: String) {
    var directoryPath = createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, RESOURCES}, new String[]{PRODUCT_MODEL, POLICY_LINE_PATTERNS, lineCode}, new String[]{})
    createDirectoriesIfNotExists(directoryPath)
  }

  private function buildFileName(fileName: String): String {
    return "${fileName}.xml"
  }
}