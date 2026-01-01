<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
var extPackage = coverable.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}ScheduleExclItemMatcherBase

@Export
class ${coverable.QualifiedName}ScheduleExclItemMatcher extends ${coverable.QualifiedName}ScheduleExclItemMatcherBase {

  construct(owner : entity.${coverable.QualifiedName}ScheduleExclItem) {
    super(owner)
  }

}