package nz.co.acc.lob.emp

uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

uses java.math.BigDecimal

/**
 * Created by ManubaF on 16/05/2017.
 */
enhancement EMPLiableEarningsACCEnhancement: EMPLiableEarnings_ACC {
  function recalculateEmbassyWorkersEarnings(provisional:boolean) {
    if(this.EmbassyWorker_ACC) {
      var embassyWorkerEarnings = LiableEarningsUtilities_ACC.calcTotalLiableEarningsEMPWPC(this.TotalGrossEarnings.Amount,
                                                                                            this.TotalEarningsNotLiable.Amount,
                                                                                            this.TotalPAYE.Amount,
                                                                                            this.TotalExcessPaid.Amount,
                                                                                            this.PaymentToEmployees.Amount,
                                                                                            this.PaymentAfterFirstWeek.Amount,
                                                                                            provisional,
                                                                                            this.ERAIndicator_ACC,
                                                                                            this.Branch.Policy.IsAEPMemberPolicy_ACC)
      this.EmbassyWorkerEarnings_ACC = new MonetaryAmount(embassyWorkerEarnings, Currency.TC_NZD)
    }
  }

}
