<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ScheduleCondItemCoverableAdapterBase

@Export
class ${coverable.QualifiedName}ScheduleCondItemCoverableAdapter extends ${coverable.QualifiedName}ScheduleCondItemCoverableAdapterBase {

  construct(owner : entity.${coverable.QualifiedName}ScheduleCondItem) {
    super(owner)
  }

}