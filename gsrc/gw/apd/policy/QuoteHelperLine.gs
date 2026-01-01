package gw.apd.policy

uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.Key
uses entity.PolicyLine

@Export
class QuoteHelperLine {

  var _line : PolicyLine as PolicyLine
  var _type : String as LineType
  var _description : String as Description
  var _settlementAmount : MonetaryAmount as SettlementAmount
  var _amount : MonetaryAmount as Amount
  var _currentTerm : MonetaryAmount as CurrentTerm
  var _futureTerm : MonetaryAmount as FutureTerm
  var _transactions : Set<Transaction> as Transactions
  var _costs : List<Cost> as Costs
  var _details : List<QuoteHelperLine> as Details
  var _order : Integer as Order

  construct() {

  }

  property get CostByCoverable() : Map<Coverable, List<Cost>> {
    return _costs.partition<Coverable>(\cost -> cost.Coverable != null ? cost.Coverable.VersionListUntyped.AllVersionsUntyped.last() as Coverable : null)
  }

  function getCostsByCost(costs: List<Cost>) : Map<Key, List<Cost>> {
    return costs.partition<Key>(\cost -> cost.FixedId)
  }

  function getSettlementAmount(costs: List<Cost>) : MonetaryAmount {
    var trans = this.getTransactionsForCostID(costs)
    if (trans.isEmpty()) return null
    return trans.sum(trans.first().SettlementCurrency, \ c -> c.AmountBilling)
  }

  function getTransactionAmount(costs: List<Cost>) : MonetaryAmount {
    var trans = this.getTransactionsForCostID(costs)
    if (trans.isEmpty()) return null
    return trans.sum(trans.first().CoverageCurrency, \ c -> c.Amount)
  }

  /**
   * Returns the transaction associated with the set of costs (if there is one)
   * Note that the costs must all have the same FixedID and be slices of the same cost
   * @param costs
   * @return List<Transaction>
   */
  private function getTransactionsForCostID(costs: List<Cost>) : List<Transaction> {
    return _transactions.where(\t -> t.Cost.FixedId == costs.first().FixedId)
  }

}