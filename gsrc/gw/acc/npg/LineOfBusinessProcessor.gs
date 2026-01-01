package gw.acc.npg

uses gw.acc.npg.exception.ValidationException
uses gw.acc.npg.handlers.EntityFilesGenerator
uses gw.acc.npg.handlers.GosuFilesGenerator
uses gw.acc.npg.handlers.LOBXmlParser
uses gw.acc.npg.handlers.ModelTransformer
uses gw.acc.npg.handlers.PCFGenerator
uses gw.acc.npg.handlers.ProductModelFilesGenerator
uses gw.acc.npg.handlers.Request
uses gw.acc.npg.handlers.ValidationHandler
uses gw.api.util.DisplayableException
uses gw.api.web.WebFile
uses org.slf4j.LoggerFactory

/**
 * Processor for generating line of business source for provided line of business model.
 * This processor assemble chain of handlers in which each handler carries out specific
 * task and then call next handler in the chain with {@link gw.acc.npg.handlers.Request}.
 * Each of this handler implements {@link gw.acc.npg.handlers.AbstractHandler}. Model parsing,
 * model transforming, model validating and generating source are tasks which carries out by
 * these handlers.
 */
class LineOfBusinessProcessor {

  private var _packageName: String as PackageName
  private var _configDirectoryPath: String as ConfigDirectoryPath
  private var _webXMLFile: WebFile as WebXMLFile
  private var _status: ProductGenerationStatus as Status = INITIALISE
  private static final var LOGGER = LoggerFactory.getLogger(LineOfBusinessProcessor)


  /**
   * Process provided new line of business xml stream to generate the source. It carries
   * out different steps like parsing xml, transforming it to model, validating the model,
   * and finally if every thing is right then generate the source for this line of business.
   */
  public function process() {
    try {
      _status = PROGRESS
      var xmlStream = WebXMLFile.InputStream
      var req = Request.createBuilder()
          .withPackageName(PackageName)
          .withXMLStream(xmlStream)
          .withAbsoluteAppPath(ConfigDirectoryPath)
          .build()
      var lobParser = new LOBXmlParser()
      var transformer = new ModelTransformer()
      var validationHandler = new ValidationHandler()
      var entityFilesGenerator = new EntityFilesGenerator()
      var gosuFileGenerator = new GosuFilesGenerator()
      var pcfGenerator = new PCFGenerator()
      var productModelFilesGenerator = new ProductModelFilesGenerator()
      lobParser.setSuccessor(transformer)
      transformer.setSuccessor(validationHandler)
      validationHandler.setSuccessor(entityFilesGenerator)
      entityFilesGenerator.setSuccessor(gosuFileGenerator)
      gosuFileGenerator.setSuccessor(pcfGenerator)
      pcfGenerator.setSuccessor(productModelFilesGenerator)
      lobParser.handleRequest(req)
      LOGGER.info("Files generated successfully.")
      _status = SUCCESS
    } catch (ex: ValidationException) {
      _status = FAILURE
      throw new DisplayableException(ex.BrokenRules.join("\n"))
    } catch (ex: Exception) {
      _status = FAILURE
      throw new DisplayableException(ex.getMessage())
    }
  }
}

