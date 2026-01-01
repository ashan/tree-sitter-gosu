<%@ params(cvg: APDCoverage) %>
<%var cbl = cvg.Coverable%>
<?xml version="1.0"?>
<CoveragePattern
  codeIdentifier="${cbl.LinePrefix}${cvg.CodeIdentifier}"
  coverageCategory="${cbl.LinePrefix}${cvg.ClauseCategory.CodeIdentifier}"
  coverageSubtype="${cbl.QualifiedName}${cvg.HasSchedule ? "Schedule" : ""}Cov"
  coveredPartyType="FirstParty"
  existence="Electable"
  lookupTableName="${cbl.QualifiedName}Cov"<%// this is actually the lookup table code%>
  owningEntityType="${cbl.QualifiedName}"
  policyLinePattern="${cbl.ProductLine.CodeIdentifier}"
  priority="${cvg.Sequence}"
  public-id="${cbl.LinePrefix}${cvg.CodeIdentifier}"
  referenceDateByType="PolicyTerm">
  ${Terms_New.renderToString(cvg.StandardTerms)}
<%if(cvg.HasSchedule){%>
  ${Schedules_New.renderToString(cvg)}
<%}%>
</CoveragePattern>