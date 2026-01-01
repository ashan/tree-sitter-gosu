<%@ params( coverable : APDCoverable ) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.logicalmatch.AbstractScheduleClauseItemMatcher
uses gw.entity.ILinkPropertyInfo

@Export
class ${coverable.QualifiedName}ScheduleCovItemMatcherBase extends AbstractScheduleClauseItemMatcher<${coverable.QualifiedName}ScheduleCovItem> {

  construct(owner : ${coverable.QualifiedName}ScheduleCovItem) {
    super(owner)
  }

  protected override property get SchedulePropertyInfo() : ILinkPropertyInfo {
    return ${coverable.QualifiedName}ScheduleCovItem.SCHEDULE_PROP.get()
  }

}