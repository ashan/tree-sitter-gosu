<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
%>
package ${basePackage}

uses gw.api.domain.financials.CostAdapter
uses gw.api.reinsurance.ReinsurableCoverable

@Export
class ${productLine.LinePrefix}CostAdapterBase implements CostAdapter {

  var _owner : entity.${productLine.LinePrefix}Cost as Owner

  construct(owner : entity.${productLine.LinePrefix}Cost) {
    _owner = owner
  }

  override function createTransaction(branch : PolicyPeriod) : Transaction {
    var transaction = new ${productLine.LinePrefix}Transaction(branch, branch.PeriodStart, branch.PeriodEnd)
    transaction.Cost = _owner.Unsliced
    return transaction
  }

  override property get Reinsurable() : Reinsurable {
    if (_owner.Coverage == null) {
      return null
    }
    var reinsurableCoverable : ReinsurableCoverable = _owner.Coverage.ReinsurableCoverable
    var candidates = reinsurableCoverable.Reinsurables.where(\r -> r.CoverageGroup == _owner.Coverage.RICoverageGroupType)
    return candidates.HasElements ? candidates.single() : null
  }

  override property get Coverable() : Coverable {
    return _owner.OwningCoverable
  }

  override property get NameOfCoverable() : String {
    return _owner.OwningCoverable != null
        ? _owner.OwningCoverable.DisplayName
        : ""
  }

  override function isMatchingBean(bean : KeyableBean) : boolean {
    return false
  }

  override property get PolicyLine() : PolicyLine {
    return _owner.${productLine.QualifiedName}
  }

}