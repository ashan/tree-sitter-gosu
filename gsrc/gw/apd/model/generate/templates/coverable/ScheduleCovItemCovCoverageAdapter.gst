<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable

@Export
class ${coverable.QualifiedName}SchCovItemCovCoverageAdapterBase extends CoverageAdapterBase {

  var _owner : entity.${coverable.QualifiedName}SchCovItemCov as Owner

  construct(owner : entity.${coverable.QualifiedName}SchCovItemCov) {
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
    return _owner.${coverable.ScheduleCovItemFieldName}
  }

  override function addToCoverageArray(coverage : Coverage) {
    //Do nothing
  }

  override function removeFromParent() {
    OwningCoverable.removeCoverageFromCoverable(_owner)
  }

  override property get ReinsurableCoverable() : ReinsurableCoverable {
    return typeSafeReinsurableCoverable(_owner.BranchValue)
  }

}