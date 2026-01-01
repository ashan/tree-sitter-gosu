package nz.co.acc.rating.util

uses gw.api.database.Query
uses gw.api.financials.CurrencyAmount
uses gw.api.locale.DisplayKey

uses java.math.BigDecimal

uses entity.ClassificationUnit_ACC
uses gw.pl.currency.MonetaryAmount

/**
 * Util class for the rating code.
 */
class ZeroRatingUtil_ACC {

  public static function zeroRateSubmission(policyPeriod: PolicyPeriod) {
    if (policyPeriod.Policy.Account.PreventReassessment_ACC) {
      // Here we need to zero rate all Liable Earnings as we do NOT send invoices out for this account type.
      for (line in policyPeriod.getLines()) {
        zeroRateSubmission(line)
      }
    }
  }


  public static function zeroRateSubmission(line: PolicyLine) {
    if (line.getAssociatedPolicyPeriod().Policy.Account.PreventReassessment_ACC) {
      // Here we need to zero rate all Liable Earnings as we do NOT send invoices out for this account type.
      switch (typeof line) {
        case productmodel.INDCoPLine:
          line.getINDCoPCovs().each( \ elt -> {elt.ActualLiableEarningsCov.TotalLiableEarnings = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)})
          line.getINDCoPCovs().each( \ elt -> {elt.ActualLiableEarningsCov.AdjustedLiableEarnings = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)})
          line.BICCodes.each( \ elt -> {elt.AdjustedLiableEarnings = new CurrencyAmount(BigDecimal.ZERO)})
          line.AssociatedPolicyPeriod.TransactionCostRPT = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
          break
        case productmodel.INDCPXLine:
          line.INDCPXCovs.first().CPXInfoCovs.each(\elt -> {elt.AgreedLevelOfCover = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)})
          line.AssociatedPolicyPeriod.TransactionCostRPT = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
          break
        case productmodel.EMPWPCLine:
          line.getEMPWPCCovs().each( \ elt -> {elt.getLiableEarnings().AdjustedLiableEarnings = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)})
          line.getEMPWPCCovs().each( \ elt -> {elt.getLiableEarnings().TotalLiableEarnings = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)})
          line.BICCodes.each( \ elt -> {elt.AdjustedLiableEarnings = new CurrencyAmount(BigDecimal.ZERO)})
          line.AssociatedPolicyPeriod.TransactionCostRPT = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
          break
        case productmodel.CWPSLine:
          for (s in line.PolicyShareholders) {
            for (share in s.ShareholderEarnings) {
              share.AdjustedLiableEarnings = new MonetaryAmount(0, Currency.TC_NZD)
              share.AdjustedLELessCpx = new MonetaryAmount(0, Currency.TC_NZD)
            }
          }
          line.AssociatedPolicyPeriod.TransactionCostRPT = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
          break
      }
    }
  }


  public static function zeroRateQuoteIfPreventReass(period: PolicyPeriod) {
    if (period.Policy.Account.PreventReassessment_ACC) {
      // Here we need to zero rate all Liable Earnings as we do NOT send invoices out for this account type.
      for (line in period.getLines()) {
        zeroRateSubmission(line)
        switch (typeof line) {
          case productmodel.INDCoPLine:
            for (cost in line.Costs) {
              cost.Basis = BigDecimal.ZERO
              cost.ActualAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
              cost.ActualAmountBilling = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
            }
            for (cost in line.WorkAccountLevyCosts) {
              cost.Basis = BigDecimal.ZERO
              cost.ActualAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
              cost.ActualAmountBilling = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
            }
            break
          case productmodel.INDCPXLine:
            for (cost in line.getCPXCosts()) {
              cost.Basis = BigDecimal.ZERO
              cost.ActualAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
              cost.ActualAmountBilling = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
              cost.ActualTermAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
              cost.ActualTermAmountBilling = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
            }
            break
          case productmodel.EMPWPCLine:
            for (cost in line.EMPCosts) {
              cost.Basis = BigDecimal.ZERO
              cost.ActualAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
              cost.ActualAmountBilling = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
            }
            break
          case productmodel.CWPSLine:
            for (cost in line.SHCCosts) {
              cost.Basis = BigDecimal.ZERO
              cost.ActualAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
              cost.ActualAmountBilling = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
            }
            break
        }
      }
    }
  }
}
