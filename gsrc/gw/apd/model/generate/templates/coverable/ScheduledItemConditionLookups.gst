<% uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.util.APDStringUtil %>
<%@ params(condition: APDCondition) %>
<%
var cbl = condition.Coverable
var conditionPatternCode = cbl.LinePrefix + condition.CodeIdentifier + "ItemCond"
%>
<?xml version="1.0"?>
<import>
  <${cbl.QualifiedName}CondLookup public-id="${APDStringUtil.makeCodeIdentifier(conditionPatternCode)}">
    <Availability>Available</Availability>
    <ConditionPatternCode>${conditionPatternCode}</ConditionPatternCode>
    <EndEffectiveDate/>
    <JobType/>
    <PolicyLinePatternCode>${cbl.ProductLine.CodeIdentifier}</PolicyLinePatternCode>
    <StartEffectiveDate>2000-01-01 00:00:00.000</StartEffectiveDate>
    <UWCompanyCode/>
  </${cbl.QualifiedName}CondLookup>
<% for (term in condition.ScheduleLinkedClauseTerms.sort(TemplateComparators.AttributeOrdering)){%>
${TermLookup.renderToString(condition, term)}
<%}%>
</import>

