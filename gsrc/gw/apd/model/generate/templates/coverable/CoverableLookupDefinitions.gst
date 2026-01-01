<%@ params(coverable:APDCoverable) %>

${coverable.LookupCblStartTag}
  <LookupTable code="${coverable.QualifiedName}Term" entityName="${coverable.QualifiedName}TermLookup" root="${coverable.QualifiedName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.QualifiedName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.QualifiedName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.QualifiedName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.QualifiedName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermPatternCode"/>
  </LookupTable>

  <LookupTable code="${coverable.QualifiedName}Opt" entityName="${coverable.QualifiedName}OptLookup" root="gw.api.domain.covterm.CovTerm" appliesTo="${coverable.QualifiedName}">
    <Filter field="CovTermPatternCode" valuePath="CovTerm.PatternCode"/>
    <Filter field="Currency" valuePath="CovTerm.Clause.Currency" exactMatch="false"/>
    <Dimension field="State" valuePath="CovTerm.Clause.OwningCoverable.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="CovTerm.Clause.PolicyLine.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="CovTerm.Clause.PolicyLine.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermOptCode"/>
  </LookupTable>

  <LookupTable code="${coverable.QualifiedName}Pack" entityName="${coverable.QualifiedName}PackLookup" root="gw.api.domain.covterm.CovTerm" appliesTo="${coverable.QualifiedName}">
    <Filter field="CovTermPatternCode" valuePath="CovTerm.PatternCode"/>
    <Filter field="Currency" valuePath="CovTerm.Clause.Currency" exactMatch="false"/>
    <Dimension field="State" valuePath="CovTerm.Clause.OwningCoverable.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="CovTerm.Clause.PolicyLine.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="CovTerm.Clause.PolicyLine.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermPackCode"/>
  </LookupTable>
${coverable.LookupCblEndTag}
<% // needs new line to ensure next tag is on its own line %>
