<%@ params(coverable:APDCoverable) %>

${coverable.LookupCblSchStartTag}
  <LookupTable code="${coverable.QualifiedName}ScheduleCovItemTerm" entityName="${coverable.QualifiedName}TermLookup" root="${coverable.QualifiedName}ScheduleCovItem">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.QualifiedName}ScheduleCovItem.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.QualifiedName}ScheduleCovItem.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.QualifiedName}ScheduleCovItem.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.QualifiedName}ScheduleCovItem.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermPatternCode"/>
  </LookupTable>

  <LookupTable code="${coverable.QualifiedName}ScheduleCovItemOpt" entityName="${coverable.QualifiedName}OptLookup" root="gw.api.domain.covterm.CovTerm" appliesTo="${coverable.QualifiedName}ScheduleCovItem">
    <Filter field="CovTermPatternCode" valuePath="CovTerm.PatternCode"/>
    <Filter field="Currency" valuePath="CovTerm.Clause.Currency" exactMatch="false"/>
    <Dimension field="State" valuePath="CovTerm.Clause.OwningCoverable.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="CovTerm.Clause.PolicyLine.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="CovTerm.Clause.PolicyLine.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermOptCode"/>
  </LookupTable>

  <LookupTable code="${coverable.QualifiedName}ScheduleCovItemPack" entityName="${coverable.QualifiedName}PackLookup" root="gw.api.domain.covterm.CovTerm" appliesTo="${coverable.QualifiedName}ScheduleCovItem">
    <Filter field="CovTermPatternCode" valuePath="CovTerm.PatternCode"/>
    <Filter field="Currency" valuePath="CovTerm.Clause.Currency" exactMatch="false"/>
    <Dimension field="State" valuePath="CovTerm.Clause.OwningCoverable.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="CovTerm.Clause.PolicyLine.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="CovTerm.Clause.PolicyLine.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermPackCode"/>
  </LookupTable>
${coverable.LookupCblSchEndTag}
<% // needs new line to ensure next tag is on its own line %>
