<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.coverage.ExclusionAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable

@Export
class ${coverable.QualifiedName}SchExclItemExclExclusionAdapterBase extends ExclusionAdapterBase {

  var _owner : entity.${coverable.QualifiedName}SchExclItemExcl as Owner

  construct(owner : entity.${coverable.QualifiedName}SchExclItemExcl) {
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
    return _owner.${coverable.ScheduleExclItemFieldName}
  }

  override function addToExclusionArray(exclusion : Exclusion) {
    //Do nothing
  }

  override function removeFromParent() {
    OwningCoverable.removeExclusionFromCoverable(_owner)
  }

}