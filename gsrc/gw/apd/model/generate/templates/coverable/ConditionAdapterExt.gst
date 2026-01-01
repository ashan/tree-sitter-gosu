<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ConditionAdapterBase

@Export
class ${coverable.QualifiedName}ConditionAdapter extends ${coverable.QualifiedName}ConditionAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}Cond) {
    super(owner)
  }

}