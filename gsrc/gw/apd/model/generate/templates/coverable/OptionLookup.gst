<% uses gw.apd.util.APDStringUtil %>
<%@ params(clause : APDClause, term: APDTerm, opt : APDDropdownEntry, ccy : Currency) %>
<% var covTermOptionCode = opt.getChoicePublicId(ccy) %>
  <${clause.Coverable.QualifiedName}OptLookup public-id="${APDStringUtil.makeCodeIdentifier(covTermOptionCode)}">
    <Availability>Available</Availability>
    <CovTermOptCode>${covTermOptionCode}</CovTermOptCode>
    <CovTermPatternCode>${term.ProductModelPublicId}</CovTermPatternCode>
    <EndEffectiveDate/>
    <StartEffectiveDate>2000-01-01 00:00:00.000</StartEffectiveDate>
    <State/>
    <Currency>${ccy.Code?:""}</Currency>
  </${clause.Coverable.QualifiedName}OptLookup>
