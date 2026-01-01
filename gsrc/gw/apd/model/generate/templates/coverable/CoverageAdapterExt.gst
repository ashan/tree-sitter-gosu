<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}CoverageAdapterBase

@Export
class ${coverable.QualifiedName}CoverageAdapter extends ${coverable.QualifiedName}CoverageAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}Cov) {
    super(owner)
  }

}