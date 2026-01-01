<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.coverage.ConditionAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable

@Export
class ${coverable.QualifiedName}SchCondItemCondConditionAdapterBase extends ConditionAdapterBase {

  var _owner : entity.${coverable.QualifiedName}SchCondItemCond as Owner

  construct(owner : entity.${coverable.QualifiedName}SchCondItemCond) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState() : Jurisdiction {
    return OwningCoverable.CoverableState
  }

  override property get PolicyLine() : PolicyLine {
    return OwningCoverable.PolicyLine
  }

  override property get OwningCoverable() : Coverable {
    return _owner.${coverable.ScheduleCondItemFieldName}
  }

  override function addToConditionArray(condition : PolicyCondition) {
    //Do nothing
  }

  override function removeFromParent() {
    OwningCoverable.removeConditionFromCoverable(_owner)
  }

}