<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ScheduleCovItemCoverableAdapterBase

@Export
class ${coverable.QualifiedName}ScheduleCovItemCoverableAdapter extends ${coverable.QualifiedName}ScheduleCovItemCoverableAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}ScheduleCovItem) {
    super(owner)
  }

}