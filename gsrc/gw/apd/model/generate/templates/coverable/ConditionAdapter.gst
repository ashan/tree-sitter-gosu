<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.util.JurisdictionMappingUtil
uses gw.coverage.ConditionAdapterBase

@Export
class ${coverable.QualifiedName}ConditionAdapterBase extends ConditionAdapterBase {

  var _owner: entity.${coverable.QualifiedName}Cond as readonly Owner

  construct(owner: entity.${coverable.QualifiedName}Cond) {
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

  override function addToConditionArray(cond : PolicyCondition) {
    _owner.${coverable.TypeName}.addTo${coverable.LinePrefix}Conditions(cond as ${coverable.QualifiedName}Cond)
  }

  override function removeFromParent() {
    _owner.${coverable.TypeName}.removeFrom${coverable.LinePrefix}Conditions(_owner)
  }

}