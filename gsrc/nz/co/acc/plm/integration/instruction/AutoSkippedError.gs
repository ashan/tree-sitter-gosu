package nz.co.acc.plm.integration.instruction

uses gw.api.util.DisplayableException

/**
 * This exception should be thrown out if transaction should auto skipped.
 */
class AutoSkippedError extends DisplayableException {

  /**
   * Constructor
   */
  public construct(message: String) {
    super(message)
  }

}