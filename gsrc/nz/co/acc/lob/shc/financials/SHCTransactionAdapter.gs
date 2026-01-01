package nz.co.acc.lob.shc.financials

uses gw.api.domain.financials.TransactionAdapter

@Export
class SHCTransactionAdapter implements TransactionAdapter {

  var _owner: entity.SHCTransaction

  construct(owner: entity.SHCTransaction) {
    _owner = owner
  }

  override property get Cost(): Cost {
    return _owner.SHCCost
  }

}