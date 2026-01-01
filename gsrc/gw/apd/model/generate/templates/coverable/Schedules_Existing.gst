<%
uses gw.apd.model.generate.xsd.clausemodel.CoveragePattern
%>
<%@ params(clause: APDClause, pmCoverage : CoveragePattern) %>
<Schedules>
  <ClauseSchedulePattern
    codeIdentifier="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}Schedule"
    priority="1"
    public-id="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}Schedule"
<%if (pmCoverage.Schedules.ClauseSchedulePattern.Required != null) {%>
    required="${pmCoverage.Schedules.ClauseSchedulePattern.Required}"
<%}%>
<%if (pmCoverage.Schedules.ClauseSchedulePattern.MostDescriptiveProperty.HasContent) {%>
    mostDescriptiveProperty="${pmCoverage.Schedules.ClauseSchedulePattern.MostDescriptiveProperty}"
<%}%>
    scheduledItemType="${clause.Coverable.QualifiedName}ScheduleCovItem">
<%if (clause.ScheduleItemProperties.HasElements) {%>
    <ScheduledItemProperties>
       ${ScheduledItemPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_BOOLEAN, pmCoverage)}
       ${ScheduledItemPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_VARCHAR, pmCoverage)}
       ${ScheduledItemPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_DATE, pmCoverage)}
       ${ScheduledItemPropertyPatterns_Existing.renderToString(clause, APDFieldType.TC_INTEGER, pmCoverage)}
       ${TypeKeyScheduledItemPropertyPatterns_Existing.renderToString(clause, pmCoverage)}
       ${PolicyLocationScheduledItemPropertyPatterns_Existing.renderToString(clause, pmCoverage)}
       ${NamedInsuredScheduledItemPropertyPatterns_Existing.renderToString(clause, pmCoverage)}
    </ScheduledItemProperties>
<%}%>
<%if (clause.ScheduleLinkedClauseTerms.HasElements) {%>
    <ScheduledItemClauseLinkages>
      <ScheduledItemClauseLink
        codeIdentifier="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ScheduleLink"
        linkedClausePattern="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ItemCov"
        public-id="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ScheduleLink"/>
    </ScheduledItemClauseLinkages>
<%}%>
  </ClauseSchedulePattern>
</Schedules>