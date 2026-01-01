<%@ params(clause: APDClause) %>
<Schedules>
  <ClauseSchedulePattern
    codeIdentifier="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}Schedule"
    priority="1"
    public-id="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}Schedule"
    required="false"
    scheduledItemType="${clause.Coverable.QualifiedName}Schedule${clause.TypeAbbreviation}Item">
<%if (clause.ScheduleItemProperties.HasElements) {%>
    <ScheduledItemProperties>
       ${ScheduledItemPropertyPatterns.renderToString(clause, APDFieldType.TC_BOOLEAN)}
       ${ScheduledItemPropertyPatterns.renderToString(clause, APDFieldType.TC_VARCHAR)}
       ${ScheduledItemPropertyPatterns.renderToString(clause, APDFieldType.TC_DATE)}
       ${ScheduledItemPropertyPatterns.renderToString(clause, APDFieldType.TC_INTEGER)}
       ${TypeKeyScheduledItemPropertyPatterns.renderToString(clause)}
       ${PolicyLocationScheduledItemPropertyPatterns.renderToString(clause)}
       ${NamedInsuredScheduledItemPropertyPatterns.renderToString(clause)}
    </ScheduledItemProperties>
<%}%>
<%if (clause.ScheduleLinkedClauseTerms.HasElements) {%>
    <ScheduledItemClauseLinkages>
      <ScheduledItemClauseLink
        codeIdentifier="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ScheduleLink"
        linkedClausePattern="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}Item${clause.TypeAbbreviation}"
        public-id="${clause.Coverable.LinePrefix}${clause.CodeIdentifier}ScheduleLink"/>
    </ScheduledItemClauseLinkages>
<%}%>
  </ClauseSchedulePattern>
</Schedules>