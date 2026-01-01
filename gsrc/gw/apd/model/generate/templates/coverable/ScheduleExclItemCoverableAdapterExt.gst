<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ScheduleExclItemCoverableAdapterBase

@Export
class ${coverable.QualifiedName}ScheduleExclItemCoverableAdapter extends ${coverable.QualifiedName}ScheduleExclItemCoverableAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}ScheduleExclItem) {
    super(owner)
  }

}