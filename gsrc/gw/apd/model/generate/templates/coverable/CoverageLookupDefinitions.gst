<%@ params(coverable:APDCoverable) %>

${coverable.LookupCovStartTag}
  <LookupTable code="${coverable.QualifiedName}Cov" entityName="${coverable.QualifiedName}CovLookup" root="${coverable.QualifiedName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.QualifiedName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.QualifiedName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.QualifiedName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.QualifiedName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CoveragePatternCode"/>
  </LookupTable>
${coverable.LookupCovEndTag}
<% // needs new line to ensure next tag is on its own line %>
