package gw.acc.npg.handlers

uses gw.acc.npg.exception.HandlerException
uses gw.acc.npg.exception.ValidationException
uses gw.acc.npg.model.ProductLine
uses gw.acc.npg.validators.NameConstraintValidator
uses gw.acc.npg.validators.CrossReferenceValidator
uses gw.acc.npg.validators.FieldTypeConstraintValidator
uses gw.acc.npg.validators.ModelValidator
uses gw.acc.npg.validators.NullConstraintValidator
uses org.slf4j.LoggerFactory

/**
 * Validation handler for validating {@link gw.acc.npg.model.ProductLine}
 * in {@link gw.acc.npg.handlers.Request}
 */
class ValidationHandler extends AbstractHandler {

  private static final var LOGGER = LoggerFactory.getLogger(ValidationHandler)
  private var _nameConstraintValidator: NameConstraintValidator
  private var _crossReferenceValidator: CrossReferenceValidator
  private var _nullConstraintValidator: NullConstraintValidator
  private var _fieldTypeConstraintValidator: ModelValidator

  override function handleRequest(req: Request) {
    if (req == null) {
      var ex = new IllegalArgumentException("Problem while validating Product Line model. Cause: [req] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
    if (req.ProductLine == null) {
      var ex = new IllegalArgumentException("Problem while validating Product Line model. Cause: [ProductLine] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
    validateProductLine(req.ProductLine)
    _nextHandler?.handleRequest(req)
  }

  /**
   * Enforce following validation on <code>productLine</code> in order
   * 1. Check mandatory fields are not null
   * 2. Check entity names, field names, product code etc are satisfying defined constraints.
   * 3. Check all the entities reference used in <code>productLine</code> are valid.
   *
   * @param productLine model to be validator
   */
  private function validateProductLine(productLine: ProductLine) {
    var brokenRules: List<String> = new ArrayList<String>()
    try {
      _nullConstraintValidator = new NullConstraintValidator()
      _nameConstraintValidator = new NameConstraintValidator()
      _crossReferenceValidator = new CrossReferenceValidator(productLine)
      _fieldTypeConstraintValidator = new FieldTypeConstraintValidator()
      productLine.accept(_nullConstraintValidator)
      brokenRules = _nullConstraintValidator.BrokenRules
      productLine.accept(_crossReferenceValidator)
      brokenRules.addAll(_crossReferenceValidator.BrokenRules)
      productLine.accept(_nameConstraintValidator)
      brokenRules.addAll(_nameConstraintValidator.BrokenRules)
      productLine.accept(_fieldTypeConstraintValidator)
      brokenRules.addAll(_fieldTypeConstraintValidator.BrokenRules)
    } catch (ex: Exception) {
      var message = "Problem while validating Product Line model. Cause: ${ex.Message}"
      LOGGER.error(message, ex)
      if (brokenRules != null and not brokenRules.HasElements) {
        throw new HandlerException(message)
      }
    }
    if (brokenRules.HasElements) {
      brokenRules.each(\rule -> LOGGER.error(rule))
      logAndThrowException(LOGGER, new ValidationException("Problem while validating Product Line model. " +
          "Constraint validation failed.", brokenRules))
    }
  }

}