package gw.lob.emp

uses nz.co.acc.lob.common.BusinessClassificationUtil_ACC
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

/**
 * Created by ManubaF on 28/02/2017.
 */
enhancement EMPWPCCovEnhancement: EMPWPCCov {
  function getLiableEarnings() : EMPLiableEarnings_ACC {
    return this.LiableEarningCov
  }

  function calculateBICLiableEarnings() {
    var liableEarnings = this.getLiableEarnings()
    liableEarnings.TotalLiableEarnings = LiableEarningsUtilities_ACC.calculateTotalLiableEarningsEMPWPC(this).ofDefaultCurrency()
    var adjustedLE = LiableEarningsUtilities_ACC.calculateAdjustedLiableEarningsEMPWPC(this)
    liableEarnings.AdjustedLiableEarnings = adjustedLE.ofDefaultCurrency()
    var bicCodes = this.EMPWPCLine.BICCodes
    var isAudit = this.EMPWPCLine.getAssociatedPolicyPeriod().Job typeis Audit

    // allocate the adjusted liable earnings
    if (isAudit) {
      BusinessClassificationUtil_ACC.allocateAdjustedLiableEarnings(liableEarnings.TotalLiableEarnings, bicCodes)
    } else {
      BusinessClassificationUtil_ACC.allocateAdjustedLiableEarnings(liableEarnings.AdjustedLiableEarnings, bicCodes)
    }

  }

}
