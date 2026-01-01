package nz.co.acc.lob.aep.financials

uses gw.api.domain.financials.TransactionAdapter

@Export
class AEPTransactionAdapter implements TransactionAdapter {

  var _owner: entity.AEPTransaction_ACC

  construct(owner: entity.AEPTransaction_ACC) {
    _owner = owner
  }

  override property get Cost(): Cost {
    return _owner.AEPCost
  }

}