package nz.co.acc.lob.common.rating.function

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.policy.function.PolicyPeriodCancelReason

uses java.util.function.Consumer

/**
 * @author Ron Webb
 * @since 2019-07-05
 */
class NextTermModifierOverrideHandler implements Consumer<OverrideHandler> {

  private static var LOG = StructuredLogger.CONFIG.withClass(NextTermModifierOverrideHandler)

  protected var _period : PolicyPeriod

  construct(period : PolicyPeriod) {
    this._period = period
  }

  public property get CancelReasonCode() : ReasonCode {
    var reason = Funxion.buildProcessor(new PolicyPeriodCancelReason()).process(_period)
    LOG.debug("ReasonCode: ${reason}")
    return reason
  }

  override function accept(overrideHandler : OverrideHandler) {
    overrideHandler.addHandler(\___data : Dynamic -> {
      ___data.CancelReasonCode = CancelReasonCode

      var output = !({ReasonCode.TC_JOINEDAEPGROUP_ACC, ReasonCode.TC_REMOVEDFROMAEPGROUP_ACC}.contains(___data.CancelReasonCode)
          && ___data.ERStatus == ERStatus_ACC.TC_NEXT_TERM_ER_MODIFIER_PENDING)

      LOG.debug("Output: ${output}")

      return output
    })
  }
}