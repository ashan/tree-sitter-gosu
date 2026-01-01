package nz.co.acc.policy.function

uses gw.surepath.suite.integration.logging.StructuredLogger
uses java.util.function.Consumer

/**
 * @author Ron Webb
 * @since 2019-07-01
 */
class PolicyPeriodCancelReasonUpdate implements Consumer<ReasonCode> {

  private static var LOG = StructuredLogger.CONFIG.withClass(PolicyPeriodCancelReasonUpdate)

  protected var _period : Dynamic

  public construct(period : Dynamic) {
    this._period = period
  }

  override function accept(reasonCode : ReasonCode) {
    LOG.debug("Reason Code: ${reasonCode}")
    _period.CancelReasonCode = reasonCode
  }
}