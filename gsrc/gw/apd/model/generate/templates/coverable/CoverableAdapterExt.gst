<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}CoverableAdapterBase

@Export
class ${coverable.QualifiedName}CoverableAdapter extends ${coverable.QualifiedName}CoverableAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}) {
    super(owner)
  }

}