<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.util.JurisdictionMappingUtil
uses gw.coverage.ExclusionAdapterBase

@Export
class ${coverable.QualifiedName}ExclusionAdapterBase extends ExclusionAdapterBase {

  var _owner : entity.${coverable.QualifiedName}Excl as readonly Owner

  construct(owner : entity.${coverable.QualifiedName}Excl) {
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

  override function addToExclusionArray(excl : Exclusion) {
    _owner.${coverable.TypeName}.addTo${coverable.LinePrefix}Exclusions(excl as ${coverable.QualifiedName}Excl)
  }

  override function removeFromParent() {
    _owner.${coverable.TypeName}.removeFrom${coverable.LinePrefix}Exclusions(_owner)
  }

}