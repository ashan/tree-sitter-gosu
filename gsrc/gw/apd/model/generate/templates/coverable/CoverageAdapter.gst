<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.coverage.CoverageAdapterBase
uses gw.api.reinsurance.ReinsurableCoverable
uses gw.api.util.JurisdictionMappingUtil

@Export
class ${coverable.QualifiedName}CoverageAdapterBase extends CoverageAdapterBase {

  var _owner : entity.${coverable.QualifiedName}Cov as readonly Owner

  construct(owner : entity.${coverable.QualifiedName}Cov) {
    super(owner)
    _owner = owner
  }

  override property get CoverageState() : Jurisdiction {
    return OwningCoverable.CoverableState
  }

  override property get PolicyLine() : PolicyLine {
<%if(coverable.Parent == null){%>
    return _owner.${coverable.TypeName}
<%}else{%>
    return _owner.${coverable.TypeName}.PolicyLine
<%}%>
  }

  override property get OwningCoverable() : Coverable {
    return _owner.${coverable.TypeName}
  }

  override function addToCoverageArray(cov : Coverage) {
    _owner.${coverable.TypeName}.addTo${coverable.LinePrefix}Coverages(cov as ${coverable.QualifiedName}Cov)
  }

  override function removeFromParent() {
    _owner.${coverable.TypeName}.removeFrom${coverable.LinePrefix}Coverages(_owner)
  }

  override property get ReinsurableCoverable() : ReinsurableCoverable {
<%if (coverable.RiskLocation == APDRiskLocationType.TC_ISLOCATION) {%>
    return typeSafeReinsurableCoverable(_owner.${coverable.TypeName}.Location)
<%} else if (coverable.RiskLocation == APDRiskLocationType.TC_ISBUILDING) {%>
    return typeSafeReinsurableCoverable(_owner.${coverable.TypeName}.Building.PolicyLocation)
<%} else if (coverable.RiskLocation == APDRiskLocationType.TC_REFLOCATION) {%>
    return typeSafeReinsurableCoverable(_owner.${coverable.TypeName}.${coverable.Fields.firstWhere(\f -> f.Jurisdiction).Name})
<%} else {// the default is the policy period as no other reinsurables are defined OOTB  %>
    return typeSafeReinsurableCoverable(_owner.BranchValue)
<%}%>
  }

}