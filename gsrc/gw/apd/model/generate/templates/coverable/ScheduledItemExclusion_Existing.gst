<%
uses gw.apd.model.generate.xsd.clausemodel.ExclusionPattern
uses gw.apd.util.APDStringUtil
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(exclusion: APDExclusion, pmExclusion : ExclusionPattern) %>
<%var cbl = exclusion.Coverable%>
<?xml version="1.0"?>
<ExclusionPattern
  codeIdentifier="${cbl.LinePrefix}${exclusion.CodeIdentifier}ItemExcl"
  coverageCategory="${cbl.LinePrefix}${exclusion.ClauseCategory.CodeIdentifier}"
  exclusionSubtype="${cbl.QualifiedName}SchExclItemExcl"
  existence="${pmExclusion.Existence}"
  lookupTableName="${cbl.QualifiedName}ScheduleExclItemExcl"<%// this is actually the lookup table code%>
  owningEntityType="${cbl.QualifiedName}ScheduleExclItem"
  policyLinePattern="${cbl.ProductLine.CodeIdentifier}"
  priority="${exclusion.Sequence}"
  public-id="${cbl.LinePrefix}${exclusion.CodeIdentifier}ItemExcl"
<%if(pmExclusion.RefCode != null){%>
  refCode="${pmExclusion.RefCode}"
<%}%>
  referenceDateByType="${pmExclusion.ReferenceDateByType}">
<%if(pmExclusion.AvailabilityScript != null){%>
  <AvailabilityScript>${APDStringUtil.makeScriptXmlCdataString(pmExclusion.AvailabilityScript)}</AvailabilityScript>
<%}%>
<%if(pmExclusion.ExistenceScript != null){%>
  <ExistenceScript>${APDStringUtil.makeScriptXmlCdataString(pmExclusion.ExistenceScript)}</ExistenceScript>
<%}%>
<%if(pmExclusion.InitializeScript != null){%>
  <InitializeScript>${APDStringUtil.makeScriptXmlCdataString(pmExclusion.InitializeScript)}</InitializeScript>
<%}%>
<%if(pmExclusion.OnRemovalScript != null){%>
  <OnRemovalScript>${APDStringUtil.makeScriptXmlCdataString(pmExclusion.OnRemovalScript)}</OnRemovalScript>
<%}%>
${ExclusionTerms_Existing.renderToString(exclusion.ScheduleLinkedClauseTerms, pmExclusion)}
</ExclusionPattern>
