<% uses gw.apd.util.APDStringUtil %>
<%@ params(clause : APDClause, term: APDTerm, pack : APDDropdownEntry, ccy : Currency) %>
<% var covTermPackageCode = pack.getChoicePublicId(ccy) %>
  <${clause.Coverable.QualifiedName}PackLookup public-id="${APDStringUtil.makeCodeIdentifier(covTermPackageCode)}">
    <Availability>Available</Availability>
    <CovTermPackCode>${covTermPackageCode}</CovTermPackCode>
    <CovTermPatternCode>${term.ProductModelPublicId}</CovTermPatternCode>
    <EndEffectiveDate/>
    <StartEffectiveDate>2000-01-01 00:00:00.000</StartEffectiveDate>
    <State/>
    <Currency>${ccy.Code?:""}</Currency>
  </${clause.Coverable.QualifiedName}PackLookup>


