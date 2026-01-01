package nz.co.acc.lob.ind.rating

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * INDLiableEarnings_ACC enhancement.
 */
enhancement INDLiableEarningsACCEnhancement: INDLiableEarnings_ACC {

  function previousYearsLiableEarnings() : INDLiableEarnings_ACC {
    var previousLevyYear = this.Branch.LevyYear_ACC - 1
    var previousPolicyPeriod = this.Branch.Policy.CompletedPeriodsWithCost.firstWhere(\elt -> elt.LevyYear_ACC == previousLevyYear).LatestPeriod
    if (previousPolicyPeriod != null) {
      return previousPolicyPeriod.INDCoPLine.INDCoPCovs.first().LiableEarningCov
    } else {
      return null
    }
  }

  function combinedEarnings() : BigDecimal {
    return (this.NetSchedulerPayments_amt + this.TotalGrossIncome_amt) - this.TotalIncomeNotLiable_amt
  }

  /**
   * The earnings must include net schedular payments but can also include Total other expenses claimed and/or total gross income
   * (earnings as an employee) and/or Total income not liable for ACC Earners’ levy.
   * If the earnings are from other key points (e.g. partnership income, self-employed, LTC etc.) return false.
   * @return
   */
  function earningsPotentiallyPartTime() : boolean {
    var zero = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
    return this.NetSchedulerPayments_amt > zero and not (this.TotalShareholderEmplSalary_amt > zero or
        this.AdjustedLTCIncome_amt > zero or this.SelfEmployedNetIncome_amt > zero or
        this.TotalOtherNetIncome_amt > zero or this.TotalOverseasIncome_amt > zero or
        this.TotalActivePartnershipInc_amt > zero)
  }

  function individualFullTimeEarningsEmpty() : boolean {
    var zero = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
    return this.FullTime and ((this.NetSchedulerPayments == null or this.NetSchedulerPayments_amt.equals(zero))
        and (this.TotalShareholderEmplSalary == null or this.TotalShareholderEmplSalary_amt.equals(zero))
        and (this.TotalGrossIncome == null or this.TotalGrossIncome_amt.equals(zero))
        and (this.TotalOtherExpensesClaimed == null or this.TotalOtherExpensesClaimed_amt.equals(zero))
        and (this.SelfEmployedNetIncome == null or this.SelfEmployedNetIncome_amt.equals(zero))
        and (this.TotalActivePartnershipInc == null or this.TotalActivePartnershipInc_amt.equals(zero))
        and (this.TotalIncomeNotLiable == null or this.TotalIncomeNotLiable_amt.equals(zero))
        and (this.AdjustedLTCIncome == null or this.AdjustedLTCIncome_amt.equals(zero))
        and (this.TotalOverseasIncome == null or this.TotalOverseasIncome_amt.equals(zero))
        and (this.TotalOtherNetIncome == null or this.TotalOtherNetIncome_amt.equals(zero))
        and (this.EarningNotLiable == null or this.EarningNotLiable_amt.equals(zero)))
  }

}
