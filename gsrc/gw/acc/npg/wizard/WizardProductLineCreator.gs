package gw.acc.npg.wizard

uses gw.acc.npg.ProductGenerationStatus
uses gw.acc.npg.exception.ValidationException
uses gw.acc.npg.handlers.EntityFilesGenerator
uses gw.acc.npg.handlers.GosuFilesGenerator
uses gw.acc.npg.handlers.PCFGenerator
uses gw.acc.npg.handlers.ProductModelFilesGenerator
uses gw.acc.npg.handlers.Request
uses gw.acc.npg.handlers.ValidationHandler
uses gw.api.util.DisplayableException
uses org.slf4j.LoggerFactory

/**
 * Processor for generating line of business source for provided line of business data form wizard
 */
class WizardProductLineCreator {

  private static final var LOGGER = LoggerFactory.getLogger(WizardProductLineCreator)
  private var _productInfoStepDTO = new ProductInfoStepDTO()
  private var _coverableStepDTOs:Set<CoverableStepDTO> = new LinkedHashSet<CoverableStepDTO>()
  private var _costsStepDTOs:Set<CostStepDTO> = new LinkedHashSet<CostStepDTO>()
  private var _otherEntitiesStepDTOs:Set<OtherEntityStepDTO> = new LinkedHashSet<OtherEntityStepDTO>()
  private var _wizardLineOfBusinessCreator: WizardLineOfBusinessCreator
  private var _status: ProductGenerationStatus = INITIALISE
  private var _isValid:boolean as IsValid =  false

  public function getProductInfoStepDTO(): ProductInfoStepDTO {
    return _productInfoStepDTO
  }

  public function getCoverableStepDTOs(): Set<CoverableStepDTO> {
    return _coverableStepDTOs
  }

  public function getCostsStepDTOs(): Set<CostStepDTO> {
    return _costsStepDTOs
  }

  public function getOtherEntitiesStepDTOs(): Set<OtherEntityStepDTO> {
    return _otherEntitiesStepDTOs
  }

  /**
   * Process provided new line of business wizard data to generate a line of business
   */
  public function process() {
    try {
      _status = PROGRESS
      var req = createRequest()
      var validationHandler = new ValidationHandler()
      var entityFilesGenerator = new EntityFilesGenerator()
      var gosuFileGenerator = new GosuFilesGenerator()
      var pcfGenerator = new PCFGenerator()
      var productModelFilesGenerator = new ProductModelFilesGenerator()
      validationHandler.setSuccessor(entityFilesGenerator)
      entityFilesGenerator.setSuccessor(gosuFileGenerator)
      gosuFileGenerator.setSuccessor(pcfGenerator)
      pcfGenerator.setSuccessor(productModelFilesGenerator)
      validationHandler.handleRequest(req)
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

  /**
   * Validate new line of business wizard data
   */
  public function isValid(): boolean {
    try {
      var req = createRequest()
      var validationHandler = new ValidationHandler()
      validationHandler.handleRequest(req)
      LOGGER.info("Files generated successfully.")
      _isValid = true
      return true
    } catch (ex: ValidationException) {
      _isValid = false
      throw new DisplayableException(ex.BrokenRules.join("\n"))
    } catch (ex: Exception) {
      _isValid = false
      throw new DisplayableException(ex.getMessage())
    }
  }

  private function createRequest(): Request {
    _wizardLineOfBusinessCreator = new WizardLineOfBusinessCreator(_productInfoStepDTO, _coverableStepDTOs, _costsStepDTOs, _otherEntitiesStepDTOs)
    var req = Request.createBuilder()
        .withProductLine(_wizardLineOfBusinessCreator.createProductLine())
        .build()
    return req
  }
}

