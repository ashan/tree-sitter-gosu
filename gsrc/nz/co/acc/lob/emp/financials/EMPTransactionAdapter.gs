package nz.co.acc.lob.emp.financials

uses gw.api.domain.financials.TransactionAdapter

@Export
class EMPTransactionAdapter implements TransactionAdapter {

  var _owner: entity.EMPTransaction

  construct(owner: entity.EMPTransaction) {
    _owner = owner
  }

  override property get Cost(): Cost {
    return _owner.EMPCost
  }

}