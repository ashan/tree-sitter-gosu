package nz.co.acc.lob.common.workqueue

/**
 * This is a custom work queue that refunds the WPC provisional levies.
 * <p>
 * WPC Policies with provisional levies > $0.00 and no final audit will be processed.
 */
class WPCRefundProvisionalLevies_ACC extends RefundProvisionalLevies_ACC {

  construct() {
    super(BatchProcessType.TC_WPCREFUNDPROVISIONALLEVIES_ACC)
  }

  /**
   * Find the qualifying WPC Refund Provisional Levies Policy Periods.
   *
   * @return target WPC Refund Provisional Levies Policies
   */
  override function findTargets(): Iterator<PolicyPeriod> {
    return super.findTargetsForPolicyLine(
        "EmployerACC",
        "WPCRefundProvisionalLeviesLevyYear_ACC")
  }
}