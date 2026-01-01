<% uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.util.APDStringUtil %>
<%@ params(exclusion: APDExclusion) %>
<%
var cbl = exclusion.Coverable
var exclusionPatternCode = cbl.LinePrefix + exclusion.CodeIdentifier + "ItemExcl"
%>
<?xml version="1.0"?>
<import>
  <${cbl.QualifiedName}ExclLookup public-id="${APDStringUtil.makeCodeIdentifier(exclusionPatternCode)}">
    <Availability>Available</Availability>
    <ExclusionPatternCode>${exclusionPatternCode}</ExclusionPatternCode>
    <EndEffectiveDate/>
    <JobType/>
    <PolicyLinePatternCode>${cbl.ProductLine.CodeIdentifier}</PolicyLinePatternCode>
    <StartEffectiveDate>2000-01-01 00:00:00.000</StartEffectiveDate>
    <UWCompanyCode/>
  </${cbl.QualifiedName}ExclLookup>
<% for (term in exclusion.ScheduleLinkedClauseTerms.sort(TemplateComparators.AttributeOrdering)){%>
${TermLookup.renderToString(exclusion, term)}
<%}%>
</import>

