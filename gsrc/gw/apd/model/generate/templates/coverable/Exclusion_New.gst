<%@ params(exclusion: APDExclusion) %>
<%var cbl = exclusion.Coverable%>
<?xml version="1.0"?>
<ExclusionPattern
  codeIdentifier="${cbl.LinePrefix}${exclusion.CodeIdentifier}"
  coverageCategory="${cbl.LinePrefix}${exclusion.ClauseCategory.CodeIdentifier}"
  exclusionSubtype="${cbl.QualifiedName}${exclusion.HasSchedule ? "Schedule" : ""}Excl"
  existence="Electable"
  lookupTableName="${cbl.LinePrefix}${cbl.TypeName}Excl"<%// this is actually the lookup table code%>
  owningEntityType="${cbl.LinePrefix}${cbl.TypeName}"
  policyLinePattern="${cbl.ProductLine.CodeIdentifier}"
  priority="${exclusion.Sequence}"
  public-id="${cbl.LinePrefix}${exclusion.CodeIdentifier}"
  referenceDateByType="PolicyTerm">
  ${Terms_New.renderToString(exclusion.StandardTerms)}
<%if(exclusion.HasSchedule){%>
  ${Schedules_New.renderToString(exclusion)}
<%}%>
</ExclusionPattern>
