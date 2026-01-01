<%
uses gw.apd.model.generate.xsd.clausemodel.ConditionPattern
%>
<%@ params(clause: APDClause, pmCondition : ConditionPattern) %>
<Schedules>
  <ClauseSchedulePattern
    codeIdentifier="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}Schedule"
    priority="1"
    public-id="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}Schedule"
<%if (pmCondition.Schedules.ClauseSchedulePattern.Required != null) {%>
    required="${pmCondition.Schedules.ClauseSchedulePattern.Required}"
<%}%>
    scheduledItemType="${clause.Coverable.QualifiedName}ScheduleCondItem">
<%if (clause.ScheduleItemProperties.HasElements) {%>
    <ScheduledItemProperties>
       ${ScheduledItemConditionPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_BOOLEAN, pmCondition)}
       ${ScheduledItemConditionPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_VARCHAR, pmCondition)}
       ${ScheduledItemConditionPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_DATE, pmCondition)}
       ${ScheduledItemConditionPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_INTEGER, pmCondition)}
       ${TypeKeyScheduledItemConditionPropertyPatterns_Existing.renderToString(clause, pmCondition)}
       ${PolicyLocationScheduledItemConditionPropertyPatterns_Existing.renderToString(clause, pmCondition)}
       ${NamedInsuredScheduledItemConditionPropertyPatterns_Existing.renderToString(clause, pmCondition)}
    </ScheduledItemProperties>
<%}%>
<%if (clause.ScheduleLinkedClauseTerms.HasElements) {%>
    <ScheduledItemClauseLinkages>
      <ScheduledItemClauseLink
        codeIdentifier="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ScheduleLink"
        linkedClausePattern="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ItemCond"
        public-id="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ScheduleLink"/>
    </ScheduledItemClauseLinkages>
<%}%>
  </ClauseSchedulePattern>
</Schedules>