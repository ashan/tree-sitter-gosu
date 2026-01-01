<%
uses gw.apd.model.generate.templates.TemplateComparators
uses org.apache.commons.lang.StringEscapeUtils
uses gw.apd.util.APDStringUtil
%>
<%@ params(productLine : APDProductLine) %>
<?xml version="1.0"?>
<import>
<% //for testing purposes need to use "AllChildCoverables" and concat the line itself here since the
   //test lines don't implement PolicyLineMethods %>
<%for (coverable in productLine.AllChildCoverables.concat({productLine}).sort(TemplateComparators.CoverableOrdering)) {%>
<% //coverable info
   var coverableLookupKey = coverable.LinePrefix + coverable.TypeName
   var coverableLookupType = APDCostDefinitionType.TC_COVERABLE.Code%>
  <${productLine.LinePrefix}CostDefinition public-id="${APDStringUtil.makeCodeIdentifier(coverableLookupKey + coverableLookupType)}">
    <LookupKey>${coverableLookupKey}</LookupKey>
    <LookupType>${coverableLookupType}</LookupType>
    <SeparateBilling>${coverable.SeparateBilling}</SeparateBilling>
    <SeparateCollection>${coverable.SeparateCollection}</SeparateCollection>
  </${productLine.LinePrefix}CostDefinition>
<%for (costDefinition in coverable.CostDefinitions.sort(TemplateComparators.CostDefinitionOrdering)) {%>
<% //coverable cost info
    var coverableCostInfoLookupKey = coverable.LinePrefix + coverable.TypeName + ":" + costDefinition.CostCode.CostCode
    var coverableCostInfoLookupType = APDCostDefinitionType.TC_CBLCOST.Code%>
  <${productLine.LinePrefix}CostDefinition public-id="${APDStringUtil.makeCodeIdentifier(coverableCostInfoLookupKey + coverableCostInfoLookupType)}">
    <LookupKey>${coverableCostInfoLookupKey}</LookupKey>
    <LookupType>${coverableCostInfoLookupType}</LookupType>
    <SeparateBilling>${costDefinition.SeparateBilling}</SeparateBilling>
    <SeparateCollection>${costDefinition.SeparateCollection}</SeparateCollection>
  </${productLine.LinePrefix}CostDefinition>
<%}%>
<%for (coverage in coverable.Coverages.sort(TemplateComparators.ClauseOrdering)) {%>
<% //coverage info
    var coverageLookupKey = productLine.LinePrefix + coverage.CodeIdentifier
    var coverageLookupType = APDCostDefinitionType.TC_COVERAGE.Code%>
  <${productLine.LinePrefix}CostDefinition public-id="${APDStringUtil.makeCodeIdentifier(coverageLookupKey + coverageLookupType)}">
    <LookupKey>${coverageLookupKey}</LookupKey>
    <LookupType>${coverageLookupType}</LookupType>
    <SeparateBilling>${coverage.SeparateBilling}</SeparateBilling>
    <SeparateCollection>${coverage.SeparateCollection}</SeparateCollection>
  </${productLine.LinePrefix}CostDefinition>
<%for (covCostDef in coverage.CostDefinitions.sort(TemplateComparators.CostDefinitionOrdering)) {%>
<% //coverage cost info
    var coverageCostInfoLookupKey = coverage.Coverable.LinePrefix + coverage.CodeIdentifier + ":" + covCostDef.CostCode.CostCode
    var coverageCostInfoLookupType = APDCostDefinitionType.TC_COVCOST.Code%>
  <${productLine.LinePrefix}CostDefinition public-id="${APDStringUtil.makeCodeIdentifier(coverageCostInfoLookupKey + coverageCostInfoLookupType)}">
    <LookupKey>${coverageCostInfoLookupKey}</LookupKey>
    <LookupType>${coverageCostInfoLookupType}</LookupType>
    <SeparateBilling>${covCostDef.SeparateBilling}</SeparateBilling>
    <SeparateCollection>${covCostDef.SeparateCollection}</SeparateCollection>
  </${productLine.LinePrefix}CostDefinition>
<%}%>
<%}%>
<%}%>
</import>