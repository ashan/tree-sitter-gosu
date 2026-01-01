<% uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.util.APDStringUtil %>
<%@ params(clause : APDClause, term: APDTerm) %>
<%
var cbl = clause.Coverable
var covTermPatternCode = term.ProductModelPublicId
%>
  <${cbl.QualifiedName}TermLookup public-id="${APDStringUtil.makeCodeIdentifier(covTermPatternCode)}">
    <Availability>Available</Availability>
    <CovTermPatternCode>${covTermPatternCode}</CovTermPatternCode>
    <EndEffectiveDate/>
    <PolicyLinePatternCode>${cbl.ProductLine.CodeIdentifier}</PolicyLinePatternCode>
    <StartEffectiveDate>2000-01-01 00:00:00.000</StartEffectiveDate>
    <State/>
  </${cbl.QualifiedName}TermLookup>
<% if (term.Type == APDFieldType.TC_TYPEKEY and term.DropDownType == APDDropDownType.TC_OPTION) for (opt in term.Codes.sort(TemplateComparators.DropdownEntryOrdering)) for(ccy in opt.Currencies.sort(TemplateComparators.TypekeyOrdering)) {%>
${OptionLookup.renderToString(clause, term, opt, ccy)}
<%}%>
<% if (term.Type == APDFieldType.TC_TYPEKEY and term.DropDownType == APDDropDownType.TC_PACKAGE) for (opt in term.Codes.sort(TemplateComparators.DropdownEntryOrdering)) for(ccy in opt.Currencies.sort(TemplateComparators.TypekeyOrdering)) {%>
${PackLookup.renderToString(clause, term, opt, ccy)}
<%}%>


