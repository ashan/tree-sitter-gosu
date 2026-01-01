<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ExclusionAdapterBase

@Export
class ${coverable.QualifiedName}ExclusionAdapter extends ${coverable.QualifiedName}ExclusionAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}Excl) {
    super(owner)
  }

}