<%
uses gw.apd.model.generate.xsd.clausemodel.ExclusionPattern
%>
<%@ params(clause: APDClause, pmExclusion : ExclusionPattern) %>
<Schedules>
  <ClauseSchedulePattern
    codeIdentifier="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}Schedule"
    priority="1"
    public-id="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}Schedule"
<%if (pmExclusion.Schedules.ClauseSchedulePattern.Required != null) {%>
    required="${pmExclusion.Schedules.ClauseSchedulePattern.Required}"
<%}%>
    scheduledItemType="${clause.Coverable.QualifiedName}ScheduleExclItem">
<%if (clause.ScheduleItemProperties.HasElements) {%>
    <ScheduledItemProperties>
       ${ScheduledItemExclusionPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_BOOLEAN, pmExclusion)}
       ${ScheduledItemExclusionPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_VARCHAR, pmExclusion)}
       ${ScheduledItemExclusionPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_DATE, pmExclusion)}
       ${ScheduledItemExclusionPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_INTEGER, pmExclusion)}
       ${TypeKeyScheduledItemExclusionPropertyPatterns_Existing.renderToString(clause, pmExclusion)}
       ${PolicyLocationScheduledItemExclusionPropertyPatterns_Existing.renderToString(clause, pmExclusion)}
       ${NamedInsuredScheduledItemExclusionPropertyPatterns_Existing.renderToString(clause, pmExclusion)}
    </ScheduledItemProperties>
<%}%>
<%if (clause.ScheduleLinkedClauseTerms.HasElements) {%>
    <ScheduledItemClauseLinkages>
      <ScheduledItemClauseLink
        codeIdentifier="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ScheduleLink"
        linkedClausePattern="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ItemExcl"
        public-id="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ScheduleLink"/>
    </ScheduledItemClauseLinkages>
<%}%>
  </ClauseSchedulePattern>
</Schedules>