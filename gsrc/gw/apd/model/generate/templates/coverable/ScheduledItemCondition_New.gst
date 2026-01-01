<%@ params(cvg: APDCondition) %>
<%var cbl = cvg.Coverable%>
<?xml version="1.0"?>
<ConditionPattern
  codeIdentifier="${cbl.LinePrefix}${cvg.CodeIdentifier}ItemCond"
  coverageCategory="${cbl.LinePrefix}${cvg.ClauseCategory.CodeIdentifier}"
  conditionSubtype="${cbl.QualifiedName}SchCondItemCond"
  existence="Electable"
  lookupTableName="${cbl.QualifiedName}ScheduleCondItemCond"<%// this is actually the lookup table code%>
  owningEntityType="${cbl.QualifiedName}ScheduleCondItem"
  policyLinePattern="${cbl.ProductLine.CodeIdentifier}"
  priority="${cvg.Sequence}"
  public-id="${cbl.LinePrefix}${cvg.CodeIdentifier}ItemCond"
  referenceDateByType="PolicyTerm">
  <AvailabilityScript></AvailabilityScript>
  <ExistenceScript></ExistenceScript>
  <InitializeScript></InitializeScript>
  <OnRemovalScript></OnRemovalScript>
  ${Terms_New.renderToString(cvg.ScheduleLinkedClauseTerms)}
</ConditionPattern>