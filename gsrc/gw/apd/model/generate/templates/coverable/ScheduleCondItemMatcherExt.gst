<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ScheduleCondItemMatcherBase

@Export
class ${coverable.QualifiedName}ScheduleCondItemMatcher extends ${coverable.QualifiedName}ScheduleCondItemMatcherBase {

  construct(owner : entity.${coverable.QualifiedName}ScheduleCondItem) {
    super(owner)
  }

}