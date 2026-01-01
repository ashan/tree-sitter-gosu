<% uses gw.acc.npg.model.Transaction %>
<%@ params(transaction:Transaction) %>
package ${transaction.LOBPackageName}.financials

uses gw.api.domain.financials.TransactionAdapter

@Export
class ${transaction.TransactionAdapterImplName} implements TransactionAdapter {

  var _owner: entity.${transaction.EntityName}

  construct(owner: entity.${transaction.EntityName}) {
    _owner = owner
  }

  override property get Cost(): Cost {
    return _owner.${transaction.FkFieldToCost.Name}
  }

}
