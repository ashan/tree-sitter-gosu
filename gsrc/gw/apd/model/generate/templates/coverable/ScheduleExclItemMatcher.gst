<%@ params( coverable : APDCoverable ) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.logicalmatch.AbstractScheduleClauseItemMatcher
uses gw.entity.ILinkPropertyInfo

@Export
class ${coverable.QualifiedName}ScheduleExclItemMatcherBase extends AbstractScheduleClauseItemMatcher<${coverable.QualifiedName}ScheduleExclItem> {

  construct(owner : ${coverable.QualifiedName}ScheduleExclItem) {
    super(owner)
  }

  protected override property get SchedulePropertyInfo() : ILinkPropertyInfo {
    return ${coverable.QualifiedName}ScheduleExclItem.SCHEDULE_PROP.get()
  }

}