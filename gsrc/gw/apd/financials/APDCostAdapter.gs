package gw.apd.financials

uses gw.api.domain.financials.CostAdapter
uses gw.api.reinsurance.ReinsurableCoverable
uses entity.PolicyLine
uses entity.Reinsurable

@Export
class APDCostAdapter implements CostAdapter {

  var _owner: entity.APDCost

  construct(owner: entity.APDCost) {
    _owner = owner
  }

  override function createTransaction(branch: PolicyPeriod): Transaction {
    var transaction = new APDTransaction(branch, branch.PeriodStart, branch.PeriodEnd)
    transaction.APDCost = _owner.Unsliced
    return transaction
  }

  override property get Reinsurable(): Reinsurable {
    if (_owner.Coverage == null) {
      return null
    }
    var rCov = _owner.Coverage.ReinsurableCoverable
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
    return _owner.ManualPolicyLine
  }
}