package gw.apd.policy

uses gw.pl.currency.MonetaryAmount
uses org.apache.commons.collections.keyvalue.MultiKey

uses java.math.BigDecimal

uses entity.PolicyLine

/**
 * Summarises costs and transactions for meaningful display to the user
 */
@Export
class QuoteHelper {
  // three levels of charges:
  //   what is collected
  //   what is itemised
  //   the underlying cost
  var _txnMap : Map<MultiKey, Map<MultiKey, Set<Transaction>>> = new HashMap<MultiKey, Map<MultiKey, Set<Transaction>>>()
  var _costMap : Map<MultiKey, Map<MultiKey, List<Cost>>> = new HashMap<MultiKey, Map<MultiKey, List<Cost>>>()
  var _lastSliceDate : Date
  var _charges : List<QuoteHelperLine> as readonly Charges

  construct(period : PolicyPeriod) {
    _lastSliceDate = period.EffectiveDatesForRating.last()
    loadTransactions(period.AllTransactions)
    for (l in period.Lines) {
      loadCosts(l)
    }
    buildCharges()
  }

  construct(line : PolicyLine) {
    _lastSliceDate = line.Branch.EffectiveDatesForRating.last()
    loadTransactions(line.Transactions)
    loadCosts(line)
    buildCharges()
  }

  private  function loadTransactions(trans : Set<Transaction>) {
    // create each charge collected
    var txnMap = trans.partition<MultiKey>(\txn -> createChargeKey(txn))
    txnMap.eachKeyAndValue(\k, val -> {
      var billMap = val.partition<MultiKey>(\txn -> createBillKey(txn))
      _txnMap.put(k, billMap)
    })
  }

  private  function loadCosts(line : PolicyLine) {
    // create each charge collected
    var costMap = line.CostVLs.allVersionsFlat<Cost>().partition<MultiKey>(\cost -> createCostKey(cost))
    costMap.eachKeyAndValue(\k, val -> {
      var billMap = val.partition<MultiKey>(\cost -> createBreakdownKey(cost))
      _costMap.put(k, billMap)
    })
  }

  private function buildCharges() {
    _charges = new ArrayList<QuoteHelperLine>()
    _costMap.eachKeyAndValue(\chgKey, chgDetails -> {
      var chg = new QuoteHelperLine() {
          :PolicyLine = chgDetails.Values.first().first().PolicyLine,
          :LineType = chgDetails.Values.first().first().ChargePattern.DisplayName,
          :Order = chgDetails.Values.first().first().ChargePattern.Priority,
          :Description = chgDetails.Values.first().first().ChargeGroup,
          :SettlementAmount = new MonetaryAmount(BigDecimal.ZERO, chgDetails.Values.first().first().SettlementCurrency),
          :Amount = new MonetaryAmount(BigDecimal.ZERO, chgDetails.Values.first().first().CoverageCurrency),
          :CurrentTerm = new MonetaryAmount(BigDecimal.ZERO, chgDetails.Values.first().first().CoverageCurrency),
          :FutureTerm = new MonetaryAmount(BigDecimal.ZERO, chgDetails.Values.first().first().CoverageCurrency),
          :Transactions = new HashSet<Transaction>(),
          :Costs = new ArrayList<Cost>(),
          :Details = new ArrayList<QuoteHelperLine>()
          }
      var chgTrans = _txnMap.get(chgKey)

      if (chgDetails.Count > 1 or chgDetails.Values.first().first().BillGroup != null) {
        chgDetails.eachKeyAndValue(\detKey, detail -> {
          var det = new QuoteHelperLine() {
              :PolicyLine = chgDetails.Values.first().first().PolicyLine,
              :LineType = detail.first().RateAmountType.DisplayName,
              :Order = detail.first().RateAmountType.Priority,
              :Description = detail.first().BillGroup,
              :SettlementAmount = new MonetaryAmount(BigDecimal.ZERO, chgDetails.Values.first().first().SettlementCurrency),
              :Amount = new MonetaryAmount(BigDecimal.ZERO, detail.first().CoverageCurrency),
              :CurrentTerm = detail.sum(detail.first().CoverageCurrency, \ c -> c.ActualAmount),
              :FutureTerm = new MonetaryAmount(BigDecimal.ZERO, detail.first().CoverageCurrency),
              :Transactions = new HashSet<Transaction>()
              }
          if (chgTrans != null) {
            var detTrans = chgTrans.get(detKey)
            if (detTrans != null) {
              det.SettlementAmount = detTrans.sum(detail.first().SettlementCurrency, \ t -> t.AmountBilling)
              det.Amount = detTrans.sum(detail.first().CoverageCurrency, \ t -> t.Amount)
              det.Transactions = detTrans
            }
          }
          var latestCosts = detail.where(\c -> c.EffectiveDate == _lastSliceDate)
          if (latestCosts != null) det.FutureTerm = latestCosts.sum(detail.first().CoverageCurrency, \ c -> c.ActualTermAmount)
          det.Costs = detail

          chg.SettlementAmount += det.SettlementAmount
          chg.Amount += det.Amount
          chg.CurrentTerm += det.CurrentTerm
          chg.FutureTerm += det.FutureTerm
          chg.Details.add(det)
        })

      } else {
        if (chgTrans != null) {
          chg.SettlementAmount = chgTrans.Values.flatten().sum(chgDetails.Values.first().first().SettlementCurrency, \t -> t.AmountBilling)
          chg.Amount = chgTrans.Values.flatten().sum(chgDetails.Values.first().first().CoverageCurrency, \t -> t.Amount)
          chg.Transactions = chgTrans.Values.flatten().toSet()
        }
        chg.CurrentTerm = chgDetails.Values.flatten().sum(chgDetails.Values.first().first().CoverageCurrency, \ c -> c.ActualAmount)
        var latestCosts = chgDetails.Values.flatten().where(\c -> c.EffectiveDate == _lastSliceDate)
        if (latestCosts != null) chg.FutureTerm = latestCosts.sum(chgDetails.Values.first().first().CoverageCurrency, \c -> c.ActualTermAmount)
        chg.Costs = chgDetails.Values.flatten().toList()
      }

      _charges.add(chg)

    })
  }

  internal static function createChargeKey(transaction : Transaction) : MultiKey {
    return new MultiKey(transaction.Cost.ChargePattern, transaction.Cost.ChargeGroup, transaction.CoverageCurrency)
  }

  internal static function createBillKey(transaction : Transaction) : MultiKey {
    return new MultiKey(transaction.Cost.RateAmountType, transaction.Cost.BillGroup)
  }

  internal static function createCostKey(cost : Cost) : MultiKey {
    return new MultiKey(cost.ChargePattern, cost.ChargeGroup, cost.CoverageCurrency)
  }

  internal static function createBreakdownKey(cost : Cost) : MultiKey {
    return new MultiKey(cost.RateAmountType, cost.BillGroup)
  }

}