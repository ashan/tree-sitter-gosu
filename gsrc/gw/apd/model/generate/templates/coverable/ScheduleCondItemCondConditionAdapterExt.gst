<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}SchCondItemCondConditionAdapterBase

@Export
class ${coverable.QualifiedName}SchCondItemCondConditionAdapter extends ${coverable.QualifiedName}SchCondItemCondConditionAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}SchCondItemCond) {
    super(owner)
  }

}