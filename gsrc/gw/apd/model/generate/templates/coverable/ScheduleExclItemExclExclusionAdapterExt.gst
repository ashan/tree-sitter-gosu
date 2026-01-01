<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}SchExclItemExclExclusionAdapterBase

@Export
class ${coverable.QualifiedName}SchExclItemExclExclusionAdapter extends ${coverable.QualifiedName}SchExclItemExclExclusionAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}SchExclItemExcl) {
    super(owner)
  }

}