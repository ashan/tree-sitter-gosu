<%@ params( coverable : APDCoverable ) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.logicalmatch.AbstractScheduleClauseItemMatcher
uses gw.entity.ILinkPropertyInfo

@Export
class ${coverable.QualifiedName}ScheduleCondItemMatcherBase extends AbstractScheduleClauseItemMatcher<${coverable.QualifiedName}ScheduleCondItem> {

  construct(owner : ${coverable.QualifiedName}ScheduleCondItem) {
    super(owner)
  }

  protected override property get SchedulePropertyInfo() : ILinkPropertyInfo {
    return ${coverable.QualifiedName}ScheduleCondItem.SCHEDULE_PROP.get()
  }

}