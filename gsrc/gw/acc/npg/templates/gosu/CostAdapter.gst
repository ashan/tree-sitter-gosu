<% uses gw.acc.npg.model.BaseCost %>
<%@ params(cost:BaseCost) %>
package ${cost.LOBPackageName}.financials

uses gw.api.domain.financials.CostAdapter
uses gw.api.reinsurance.ReinsurableCoverable

@Export
class ${cost.CostAdapterImplName} implements CostAdapter {

  var _owner: entity.${cost.EntityName}

  construct(owner: entity.${cost.EntityName}) {
    _owner = owner
  }

  override function createTransaction(branch: PolicyPeriod): Transaction {
    var transaction = new ${cost.TransactionEntityName}(branch, branch.PeriodStart, branch.PeriodEnd)
    transaction.${cost.asReferenceFkField().Name} = _owner.Unsliced
    return transaction
  }

  override property get Reinsurable(): Reinsurable {
    if (_owner.Coverage == null) {
      return null
    }
    var rCov: ReinsurableCoverable = _owner.Coverage.ReinsurableCoverable
    var candidates = rCov.Reinsurables.where(\r -> r.CoverageGroup == _owner.Coverage.RICoverageGroupType)
    return candidates.HasElements ? candidates.single() : null
  }

  override property get Coverable(): Coverable {
    return _owner.OwningCoverable
  }

  override property get NameOfCoverable(): String {
    if (_owner.OwningCoverable != null) {
      return _owner.OwningCoverable.DisplayName
    }
    return ""
  }

  override function isMatchingBean(bean: KeyableBean): boolean {
    return false
  }

  override property get PolicyLine(): PolicyLine {
    return _owner.${cost.LineFKField.Name}
  }
}