package nz.co.acc.lob.ind

uses gw.api.locale.DisplayKey
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.util.FeatureToogleUtil

uses java.math.BigDecimal

/**
 * Created by manubaf on 07/07/2020.
 */
enhancement INDLiableEarnings_ACCEnhancement : INDLiableEarnings_ACC {
  property get LiableEarningsFieldsIsZero() : boolean {
    var liableEarningsZero = this.NetSchedulerPayments.IsZero and
        this.TotalActivePartnershipInc?.IsZero and
        this.SelfEmployedNetIncome?.IsZero and
        this.AdjustedLTCIncome?.IsZero
    if (FeatureToogleUtil.overseasIncomeEnabled(this.Branch.LevyYear_ACC)) {
      return liableEarningsZero and this.TotalOverseasIncome?.IsZero
    } else {
      return liableEarningsZero
    }
  }

  property get IndividualLiableEarningsFieldsIsZero() : boolean {
    var liableEarningsZero = this.NetSchedulerPayments.IsZero and
        this.TotalActivePartnershipInc?.IsZero and
        this.SelfEmployedNetIncome?.IsZero and
        this.AdjustedLTCIncome?.IsZero and
        this.TotalOtherExpensesClaimed?.IsZero
    if (FeatureToogleUtil.overseasIncomeEnabled(this.Branch.LevyYear_ACC)) {
      return liableEarningsZero and this.TotalOverseasIncome?.IsZero
    } else {
      return liableEarningsZero
    }
  }

  function setAdjustedLiableEarningsToZero() {
    this.AdjustedLiableEarnings = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
    this.VariableAdjustmentDescription = null
  }

  property get OverseasIncomeLabel_ACC() : String {
    return FeatureToogleUtil.overseasIncomeEnabled(this.Branch.LevyYear_ACC) ? DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.TotalOverseasIncome2023") : DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.TotalOverseasIncome")
  }

  property get OverseasIncomeLabelCapital_ACC() : String {
    return FeatureToogleUtil.overseasIncomeEnabled(this.Branch.LevyYear_ACC) ? DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.TotalOverseasIncome2023CapitalCase") : DisplayKey.get("Web.CoverPlus_ACC.Coverage.LiableEarnings.TotalOverseasIncomeCapitalCase")
  }
}
