<%
uses gw.apd.model.generate.xsd.clausemodel.ConditionPattern
uses gw.apd.util.APDStringUtil
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(condition: APDCondition, pmCondition : ConditionPattern) %>
<%var cbl = condition.Coverable%>
<?xml version="1.0"?>
<ConditionPattern
  codeIdentifier="${cbl.LinePrefix}${condition.CodeIdentifier}"
  coverageCategory="${cbl.LinePrefix}${condition.ClauseCategory.CodeIdentifier}"
  conditionSubtype="${cbl.QualifiedName}${condition.HasSchedule ? "Schedule" : ""}Cond"
  existence="${pmCondition.Existence}"
  lookupTableName="${cbl.LinePrefix}${cbl.TypeName}Cond"<%// this is actually the lookup table code%>
  owningEntityType="${cbl.LinePrefix}${cbl.TypeName}"
  policyLinePattern="${cbl.ProductLine.CodeIdentifier}"
  priority="${condition.Sequence}"
  public-id="${cbl.LinePrefix}${condition.CodeIdentifier}"
<%if(pmCondition.RefCode != null){%>
  refCode="${pmCondition.RefCode}"
<%}%>
  referenceDateByType="${pmCondition.ReferenceDateByType}">
<%if(pmCondition.AvailabilityScript != null){%>
  <AvailabilityScript>${APDStringUtil.makeScriptXmlCdataString(pmCondition.AvailabilityScript)}</AvailabilityScript>
<%}%>
<%if(pmCondition.ExistenceScript != null){%>
  <ExistenceScript>${APDStringUtil.makeScriptXmlCdataString(pmCondition.ExistenceScript)}</ExistenceScript>
<%}%>
<%if(pmCondition.InitializeScript != null){%>
  <InitializeScript>${APDStringUtil.makeScriptXmlCdataString(pmCondition.InitializeScript)}</InitializeScript>
<%}%>
<%if(pmCondition.OnRemovalScript != null){%>
  <OnRemovalScript>${APDStringUtil.makeScriptXmlCdataString(pmCondition.OnRemovalScript)}</OnRemovalScript>
<%}%>
${ConditionTerms_Existing.renderToString(condition.StandardTerms, pmCondition)}
<%if(condition.ScheduleItemProperties.HasElements or condition.ScheduleLinkedClauseTerms.HasElements){%>
  ${SchedulesCondition_Existing.renderToString(condition, pmCondition)}
<%}%>
</ConditionPattern>
