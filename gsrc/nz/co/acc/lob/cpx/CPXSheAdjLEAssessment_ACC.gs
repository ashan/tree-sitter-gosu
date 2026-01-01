package nz.co.acc.lob.cpx

uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by andy on 24/04/2017.
 */
class CPXSheAdjLEAssessment_ACC {

  public static function assessCPXAdjustedLiableEarnings_ACC(cpxPolicyDetails: PolicySHECPXDetails_ACC, policyPeriod : PolicyPeriod, shareholder : PolicyShareholder_ACC)  {

    var shareCPXAuditLiableEarnings : MonetaryAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)
    var shareCPXAdjLiableEarnings : MonetaryAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD).setScale(2)

    if (cpxPolicyDetails.cpxStartDate == null or
        cpxPolicyDetails.cpxEndDate == null) {
      // All the values are not populated yet so zero out the amounts
      cpxPolicyDetails.shareAuditAdjLE = shareCPXAuditLiableEarnings
      cpxPolicyDetails.shareAdjLE = shareCPXAdjLiableEarnings
      return
    }

    // If shareholder is NOT on CPX
    if ( shareholder.getPolicySHECPXDetails().first().cpxStartDate == null ) {
      cpxPolicyDetails.shareAuditAdjLE = shareCPXAuditLiableEarnings
      cpxPolicyDetails.shareAdjLE = shareCPXAdjLiableEarnings
      return
    }

    // Invalid Days entered  start date after end date
    if (cpxPolicyDetails.cpxStartDate.after(cpxPolicyDetails.cpxEndDate)) {
      //Nope.  Return 0
      cpxPolicyDetails.shareAuditAdjLE = shareCPXAuditLiableEarnings
      cpxPolicyDetails.shareAdjLE = shareCPXAdjLiableEarnings
      return
    }

    // Number of days the WPS period is for (***  Full year should eb 365 ***)
    var wpsPeriodDaysCount : int = policyPeriod.PeriodStart.daysBetween(policyPeriod.PeriodEnd) + 1

    // Guidewire period runs from 1/4/yy to 1/4/yy+1.  This is one day to many
    if (policyPeriod.PeriodEnd.MonthOfYear == 4 and
        policyPeriod.PeriodEnd.DayOfMonth == 1) {
      // The end date is 1/4/yy so remove one day from the count
      wpsPeriodDaysCount=wpsPeriodDaysCount-1
    }

    // Number of days specified on "Shareholder on CPX" row  ( Not more than wpsPeriodDaysCount )
    var shareholderCPXDaysCount : int = cpxPolicyDetails.cpxStartDate.daysBetween(cpxPolicyDetails.cpxEndDate) + 1

    // Guidewire period runs from 1/4/yy to 1/4/yy+1.  This is one day to many
    if (cpxPolicyDetails.cpxEndDate.MonthOfYear == 4 and
        cpxPolicyDetails.cpxEndDate.DayOfMonth == 1) {
      // The end date is 1/4/yy so remove one day from the count
      shareholderCPXDaysCount=shareholderCPXDaysCount-1
    }

    // $52,000 / 365 days= $142.46575
    // 365 days - 243 days = 122 days
    // $142.46575 x 122 days = $17,380.821 then round to two decimal places = $17,380.82
    // CPX Adjusted Liable Earnings = $17,380.82

    var shareWPSLiableEarnings : MonetaryAmount = shareholder.sumLiableEarnings()
    var shareWPSAdjLiableEarnings : MonetaryAmount = shareholder.sumAdjustedLiableEarnings()

    var dailyWPSLiableEarningsAmount : MonetaryAmount = shareWPSLiableEarnings.divide(wpsPeriodDaysCount)
    var dailyWPSAdjLiableEarningsAmount : MonetaryAmount = shareWPSAdjLiableEarnings.divide(wpsPeriodDaysCount)

    shareCPXAuditLiableEarnings = dailyWPSLiableEarningsAmount.multiply(shareholderCPXDaysCount)
    shareCPXAdjLiableEarnings = dailyWPSAdjLiableEarningsAmount.multiply(shareholderCPXDaysCount)

    cpxPolicyDetails.shareAuditAdjLE = shareCPXAuditLiableEarnings.setScale(2, RoundingMode.HALF_UP)
    cpxPolicyDetails.shareAdjLE = shareCPXAdjLiableEarnings.setScale(2, RoundingMode.HALF_UP)

  }
}