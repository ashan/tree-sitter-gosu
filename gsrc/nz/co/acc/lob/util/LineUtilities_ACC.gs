package nz.co.acc.lob.util

uses entity.*
uses nz.co.acc.lob.common.DateUtil_ACC

/**
 * Created by ManubaF on 21/04/2017.
 */
class LineUtilities_ACC {

  static public function adjustCPXEarnings(policyPeriod:PolicyPeriod, earnings:CPXInfoCov_ACC){
    if(earnings.PeriodEnd.afterOrEqual(policyPeriod.PeriodStart) or
        DateUtil_ACC.isSameDay(earnings.PeriodEnd, policyPeriod.PeriodStart)) {
      nz.co.acc.lob.cpx.INDCPXCovUtil_ACC.adjustNominatedCoverages(earnings, policyPeriod.SliceDate)
      earnings.PeriodStart = policyPeriod.PeriodStart
      earnings.PeriodEnd = policyPeriod.PeriodEnd
    } else {
      policyPeriod.INDCPXLine.INDCPXCovs.first().removeFromCPXInfoCovs(earnings)
    }
  }
}