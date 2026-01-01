package gw.plugin.billing.bc1000

uses gw.plugin.billing.IChargeBreakdownCommissionablePlugin

@Export
class ChargeBreakdownCommissionablePlugin implements IChargeBreakdownCommissionablePlugin {

  construct() {
  }

  override function isCommissionable(associatedTransactions : List<Transaction>) : Boolean {
    if (associatedTransactions == null or associatedTransactions.Empty) {
      return null
    }
    return not associatedTransactions.allMatch(\transaction -> RateAmountType.TF_TAXESANDSURCHARGES.TypeKeys.contains(transaction.Cost.RateAmountType))
  }
}