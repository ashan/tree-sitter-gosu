<%@ params(cvg: APDExclusion) %>
<%var cbl = cvg.Coverable%>
<?xml version="1.0"?>
<ExclusionPattern
  codeIdentifier="${cbl.LinePrefix}${cvg.CodeIdentifier}ItemExcl"
  coverageCategory="${cbl.LinePrefix}${cvg.ClauseCategory.CodeIdentifier}"
  exclusionSubtype="${cbl.QualifiedName}SchExclItemExcl"
  existence="Electable"
  lookupTableName="${cbl.QualifiedName}ScheduleExclItemExcl"<%// this is actually the lookup table code%>
  owningEntityType="${cbl.QualifiedName}ScheduleExclItem"
  policyLinePattern="${cbl.ProductLine.CodeIdentifier}"
  priority="${cvg.Sequence}"
  public-id="${cbl.LinePrefix}${cvg.CodeIdentifier}ItemExcl"
  referenceDateByType="PolicyTerm">
  <AvailabilityScript></AvailabilityScript>
  <ExistenceScript></ExistenceScript>
  <InitializeScript></InitializeScript>
  <OnRemovalScript></OnRemovalScript>
  ${Terms_New.renderToString(cvg.ScheduleLinkedClauseTerms)}
</ExclusionPattern>