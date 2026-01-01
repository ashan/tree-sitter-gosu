<%@ params(condition: APDCondition) %>
<%var cbl = condition.Coverable%>
<?xml version="1.0"?>
<ConditionPattern
  codeIdentifier="${cbl.LinePrefix}${condition.CodeIdentifier}"
  coverageCategory="${cbl.LinePrefix}${condition.ClauseCategory.CodeIdentifier}"
  conditionSubtype="${cbl.QualifiedName}${condition.HasSchedule ? "Schedule" : ""}Cond"
  existence="Electable"
  lookupTableName="${cbl.LinePrefix}${cbl.TypeName}Cond"<%// this is actually the lookup table code%>
  owningEntityType="${cbl.LinePrefix}${cbl.TypeName}"
  policyLinePattern="${cbl.ProductLine.CodeIdentifier}"
  priority="${condition.Sequence}"
  public-id="${cbl.LinePrefix}${condition.CodeIdentifier}"
  referenceDateByType="PolicyTerm">
  ${Terms_New.renderToString(condition.StandardTerms)}
<%if(condition.HasSchedule){%>
  ${Schedules_New.renderToString(condition)}
<%}%>
</ConditionPattern>
