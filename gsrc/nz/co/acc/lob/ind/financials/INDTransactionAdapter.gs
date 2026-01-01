package nz.co.acc.lob.ind.financials

uses gw.api.domain.financials.TransactionAdapter

@Export
class INDTransactionAdapter implements TransactionAdapter {

  var _owner: entity.INDTransaction

  construct(owner: entity.INDTransaction) {
    _owner = owner
  }

  override property get Cost(): Cost {
    return _owner.INDCost
  }

}