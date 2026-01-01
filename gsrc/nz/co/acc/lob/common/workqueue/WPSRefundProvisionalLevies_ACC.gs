package nz.co.acc.lob.common.workqueue

/**
 * This is a custom work queue that refunds the WPS provisional levies.
 * <p>
 * WPS Policies with provisional levies > $0.00 and no final audit will be processed.
 */
class WPSRefundProvisionalLevies_ACC extends RefundProvisionalLevies_ACC {

  construct() {
    super(BatchProcessType.TC_WPSREFUNDPROVISIONALLEVIES_ACC)
  }

  /**
   * Find the qualifying WPS Refund Provisional Levies Policy Periods.
   *
   * @return target WPS Refund Provisional Levies Policies
   */
  override function findTargets(): Iterator<PolicyPeriod> {
    return super.findTargetsForPolicyLine(
        "ShareholdingCompany",
        "WPSRefundProvisionalLeviesLevyYear_ACC")
  }
}