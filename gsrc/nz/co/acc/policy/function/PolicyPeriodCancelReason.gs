package nz.co.acc.policy.function

uses gw.lang.reflect.Expando
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion

uses java.util.function.Function

/**
 * @author Ron Webb
 * @since 2019-07-01
 */
class PolicyPeriodCancelReason implements Function<PolicyPeriod, ReasonCode> {

  private static var LOG = StructuredLogger.CONFIG.withClass(PolicyPeriodCancelReason)

  protected var _policyPeriod : Dynamic

  public construct() {
    this._policyPeriod = new Expando()
  }

  public static structure CancellationStruct {
    property get CancelReasonCode() : ReasonCode
  }

  public function findCancellationJob(policyPeriod : PolicyPeriod) : CancellationStruct {
    return Funxion.buildProcessor(new PolicyPeriodCancellationJob()).process(policyPeriod)
  }

  override function apply(policyPeriod : PolicyPeriod) : ReasonCode {
    if (policyPeriod != null) {
      _policyPeriod = policyPeriod
    }

    var cancellation = findCancellationJob(policyPeriod)
    if (cancellation != null && _policyPeriod.CancelReasonCode == null) {
      _policyPeriod.CancelReasonCode = cancellation.CancelReasonCode
    }

    LOG.debug("CancelReasonCode: ${_policyPeriod.CancelReasonCode}")

    return _policyPeriod.CancelReasonCode
  }

}