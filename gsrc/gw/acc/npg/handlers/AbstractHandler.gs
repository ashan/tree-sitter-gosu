package gw.acc.npg.handlers

uses org.slf4j.Logger

/**
 * Abstract handler to facilitate defining piece of work to be executed in defined order. All the
 * chosen handlers are get executed in chain in pre-defined order.
 *
 * @see https://en.wikipedia.org/wiki/Chain-of-responsibility_pattern
 */
abstract class AbstractHandler {

  protected var _nextHandler: AbstractHandler

  /**
   * Set the next handler in the chain, which will be called after this handler completes its execution.
   * If no successor is defined chain will be end here.
   *
   * @param handler will be called by this handler when it complete its execution
   */
  function setSuccessor(handler: AbstractHandler) {
    _nextHandler = handler
  }

  /**
   * Handle request and do the necessary work defined by implementing classes.
   *
   * @param req Request carries information required to carried out processing for the handler
   */
  abstract function handleRequest(req: Request)

  /**
   * Logg error message by provided {@literal logger} and throe {@literal exception}
   *
   * @param logger
   * @param excpetion
   */
  protected function logAndThrowException(logger: Logger, excpetion: Exception) {
    logger.error(excpetion.Message, excpetion)
    throw excpetion
  }
}