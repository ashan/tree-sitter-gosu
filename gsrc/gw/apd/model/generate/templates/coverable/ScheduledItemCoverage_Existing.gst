<%
uses gw.apd.model.generate.xsd.clausemodel.CoveragePattern
uses gw.apd.util.APDStringUtil
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(coverage: APDCoverage, pmCoverage : CoveragePattern) %>
<%var cbl = coverage.Coverable%>
<?xml version="1.0"?>
<CoveragePattern
  codeIdentifier="${cbl.LinePrefix}${coverage.CodeIdentifier}ItemCov"
  coverageCategory="${cbl.LinePrefix}${coverage.ClauseCategory.CodeIdentifier}"
  coverageSubtype="${cbl.QualifiedName}SchCovItemCov"
  coveredPartyType="${pmCoverage.CoveredPartyType}"
  existence="${pmCoverage.Existence}"
  lookupTableName="${cbl.QualifiedName}ScheduleCovItemCov"<%// this is actually the lookup table code%>
  owningEntityType="${cbl.QualifiedName}ScheduleCovItem"
  policyLinePattern="${cbl.ProductLine.CodeIdentifier}"
  priority="${coverage.Sequence}"
  public-id="${cbl.LinePrefix}${coverage.CodeIdentifier}ItemCov"
<%if(pmCoverage.RefCode != null){%>
  refCode="${pmCoverage.RefCode}"
<%}%>
  referenceDateByType="${pmCoverage.ReferenceDateByType}">
<%if(pmCoverage.AvailabilityScript != null){%>
  <AvailabilityScript>${APDStringUtil.makeScriptXmlCdataString(pmCoverage.AvailabilityScript)}</AvailabilityScript>
<%}%>
<%if(pmCoverage.ExistenceScript != null){%>
  <ExistenceScript>${APDStringUtil.makeScriptXmlCdataString(pmCoverage.ExistenceScript)}</ExistenceScript>
<%}%>
<%if(pmCoverage.InitializeScript != null){%>
  <InitializeScript>${APDStringUtil.makeScriptXmlCdataString(pmCoverage.InitializeScript)}</InitializeScript>
<%}%>
<%if(pmCoverage.OnRemovalScript != null){%>
  <OnRemovalScript>${APDStringUtil.makeScriptXmlCdataString(pmCoverage.OnRemovalScript)}</OnRemovalScript>
<%}%>
${CoverageTerms_Existing.renderToString(coverage.ScheduleLinkedClauseTerms, pmCoverage)}
</CoveragePattern>
