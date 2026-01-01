<%@ params(coverable:APDCoverable) %>

${coverable.LookupCblSchConditionStartTag}
  <LookupTable code="${coverable.QualifiedName}ScheduleCondItemTerm" entityName="${coverable.QualifiedName}TermLookup" root="${coverable.QualifiedName}ScheduleCondItem">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.QualifiedName}ScheduleCondItem.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.QualifiedName}ScheduleCondItem.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.QualifiedName}ScheduleCondItem.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.QualifiedName}ScheduleCondItem.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermPatternCode"/>
  </LookupTable>

  <LookupTable code="${coverable.QualifiedName}ScheduleCondItemOpt" entityName="${coverable.QualifiedName}OptLookup" root="gw.api.domain.covterm.CovTerm" appliesTo="${coverable.QualifiedName}ScheduleCondItem">
    <Filter field="CovTermPatternCode" valuePath="CovTerm.PatternCode"/>
    <Filter field="Currency" valuePath="CovTerm.Clause.Currency" exactMatch="false"/>
    <Dimension field="State" valuePath="CovTerm.Clause.OwningCoverable.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="CovTerm.Clause.PolicyLine.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="CovTerm.Clause.PolicyLine.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermOptCode"/>
  </LookupTable>

  <LookupTable code="${coverable.QualifiedName}ScheduleCondItemPack" entityName="${coverable.QualifiedName}PackLookup" root="gw.api.domain.covterm.CovTerm" appliesTo="${coverable.QualifiedName}ScheduleCondItem">
    <Filter field="CovTermPatternCode" valuePath="CovTerm.PatternCode"/>
    <Filter field="Currency" valuePath="CovTerm.Clause.Currency" exactMatch="false"/>
    <Dimension field="State" valuePath="CovTerm.Clause.OwningCoverable.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="CovTerm.Clause.PolicyLine.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="CovTerm.Clause.PolicyLine.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermPackCode"/>
  </LookupTable>
${coverable.LookupCblSchConditionEndTag}
<% // needs new line to ensure next tag is on its own line %>
