package gw.acc.npg.exception

/**
 * Type of {@link gw.acc.npg.exception.HandlerException} specific to validation failure.
 */
class ValidationException extends HandlerException {

  /**
   * BrokenRule specifies all the validation messages collected after executing validator.
   */
  private var _brokenRules: List<String>as BrokenRules

  public construct() {
  }

  public construct(msg: String, brokenRules: List<String>) {
    super(msg);
    _brokenRules = brokenRules
  }

}