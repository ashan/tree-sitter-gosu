<%@ params(cvg: APDCoverage) %>
<%var cbl = cvg.Coverable%>
<?xml version="1.0"?>
<CoveragePattern
  codeIdentifier="${cbl.LinePrefix}${cvg.CodeIdentifier}ItemCov"
  coverageCategory="${cbl.LinePrefix}${cvg.ClauseCategory.CodeIdentifier}"
  coverageSubtype="${cbl.QualifiedName}SchCovItemCov"
  coveredPartyType="FirstParty"
  existence="Electable"
  lookupTableName="${cbl.QualifiedName}ScheduleCovItemCov"<%// this is actually the lookup table code%>
  owningEntityType="${cbl.QualifiedName}ScheduleCovItem"
  policyLinePattern="${cbl.ProductLine.CodeIdentifier}"
  priority="${cvg.Sequence}"
  public-id="${cbl.LinePrefix}${cvg.CodeIdentifier}ItemCov"
  referenceDateByType="PolicyTerm">
  <AvailabilityScript></AvailabilityScript>
  <ExistenceScript></ExistenceScript>
  <InitializeScript></InitializeScript>
  <OnRemovalScript></OnRemovalScript>
  ${Terms_New.renderToString(cvg.ScheduleLinkedClauseTerms)}
</CoveragePattern>