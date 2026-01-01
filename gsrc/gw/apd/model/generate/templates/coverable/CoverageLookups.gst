<% uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.util.APDStringUtil %>
<%@ params(coverage: APDCoverage) %>
<%
var cbl = coverage.Coverable
var coveragePatternCode = cbl.LinePrefix + coverage.CodeIdentifier
%>
<?xml version="1.0"?>
<import>
  <${cbl.QualifiedName}CovLookup public-id="${APDStringUtil.makeCodeIdentifier(coveragePatternCode)}">
    <Availability>Available</Availability>
    <CoveragePatternCode>${coveragePatternCode}</CoveragePatternCode>
    <EndEffectiveDate/>
    <JobType/>
    <PolicyLinePatternCode>${cbl.ProductLine.CodeIdentifier}</PolicyLinePatternCode>
    <StartEffectiveDate>2000-01-01 00:00:00.000</StartEffectiveDate>
    <UWCompanyCode/>
  </${cbl.QualifiedName}CovLookup>
<% for (term in coverage.StandardTerms.sort(TemplateComparators.AttributeOrdering)){%>
${TermLookup.renderToString(coverage, term)}
<%}%>
</import>

