package nz.co.acc.lob.cpx.financials

uses gw.api.domain.financials.TransactionAdapter

@Export
class CPXTransactionAdapter implements TransactionAdapter {

  var _owner: entity.CPXTransaction

  construct(owner: entity.CPXTransaction) {
    _owner = owner
  }

  override property get Cost(): Cost {
    return _owner.CPXCost
  }

}