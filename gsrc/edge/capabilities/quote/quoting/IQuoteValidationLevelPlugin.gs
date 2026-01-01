package edge.capabilities.quote.quoting


/**
 * Interface used by quoting process to determine the validation level.
 */
interface IQuoteValidationLevelPlugin {
  /**
   * Returns a validation level to be used when quoting.
   */
  public function getValidationLevel() : ValidationLevel

}
