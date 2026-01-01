<%@ params(coverable:APDCoverable) %>

${coverable.LookupSchItemCovStartTag}
  <LookupTable code="${coverable.QualifiedName}ScheduleCovItemCov" entityName="${coverable.QualifiedName}CovLookup" root="${coverable.QualifiedName}ScheduleCovItem">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.QualifiedName}ScheduleCovItem.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.QualifiedName}ScheduleCovItem.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.QualifiedName}ScheduleCovItem.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.QualifiedName}ScheduleCovItem.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CoveragePatternCode"/>
  </LookupTable>
${coverable.LookupSchItemCovEndTag}
<% // needs new line to ensure next tag is on its own line %>
