package nz.co.acc.lob.ind.rating

uses gw.api.financials.CurrencyAmount
uses gw.api.locale.DisplayKey
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

uses java.math.BigDecimal

/**
 * Created by ManubaF on 11/05/2017.
 */
enhancement INDCoPCovACCEnhancement: INDCoPCov {

  function updateFullTime(fullTime : boolean) {
    var liableEarnings = CurrentLiableEarnings
    liableEarnings.FullTime = fullTime
  }

  property get CurrentLiableEarnings() : INDLiableEarnings_ACC{
    var liableEarnings : INDLiableEarnings_ACC
    if(this.Branch.IsNewLERuleAppliedYear) {
      liableEarnings = this.ActualLiableEarningsCov
      if(this.Branch.IsLETransitionYear) {
        liableEarnings = this.LiableEarningCov
      }
    }
    else if(this.INDCoPLine.AssociatedPolicyPeriod.CeasedTrading_ACC) {
      liableEarnings = this.ActualLiableEarningsCov
    }
    else {
      liableEarnings = this.LiableEarningCov
    }
    return liableEarnings
  }

  function calculateBICLiableEarnings(updateBICEarnings:boolean) {
    var liableEarnings : INDLiableEarnings_ACC
    if(this.Branch.IsNewLERuleAppliedYear) {
      liableEarnings = this.ActualLiableEarningsCov
      calculateBICLiableEarnings(liableEarnings)

      if(this.Branch.IsLETransitionYear) {
        calculateBICLiableEarnings(this.LiableEarningCov)
      }
    }
    else if(this.INDCoPLine.AssociatedPolicyPeriod.CeasedTrading_ACC) {
      liableEarnings = this.ActualLiableEarningsCov
      calculateBICLiableEarnings(liableEarnings)
      calculateBICLiableEarnings(this.LiableEarningCov)
    } else {
      liableEarnings = this.LiableEarningCov
      calculateBICLiableEarnings(liableEarnings)
    }

    if (this.INDCoPLine.BICCodes.length > 0 and updateBICEarnings) {
      this.INDCoPLine.BICCodes.first().AdjustedLiableEarnings = new CurrencyAmount(liableEarnings.AdjustedLiableEarnings.Amount, Currency.TC_NZD)
    }
  }

  function calculateBICLiableEarnings(liableEarnings : INDLiableEarnings_ACC) {
    liableEarnings.TotalLiableEarnings = LiableEarningsUtilities_ACC.calculateTotalLiableEarningsINDCoP(liableEarnings).ofDefaultCurrency()
    if((liableEarnings.TotalLiableEarnings.IsZero and liableEarnings.TotalOverseasIncome.IsZero and liableEarnings.TotalOtherExpensesClaimed.IsNotZero) or
        (liableEarnings.IndividualLiableEarningsFieldsIsZero and liableEarnings.TotalLiableEarnings.IsZero)) {
      liableEarnings.setAdjustedLiableEarningsToZero()
    }
    else {
      var adjustedLE = LiableEarningsUtilities_ACC.calculateAdjustedLiableEarningsINDCoP(liableEarnings)
      liableEarnings.AdjustedLiableEarnings = adjustedLE.First.ofDefaultCurrency()
      liableEarnings.VariableAdjustmentDescription = adjustedLE.Second
    }
  }
}
