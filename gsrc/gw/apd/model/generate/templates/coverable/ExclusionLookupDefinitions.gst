<%@ params(coverable:APDCoverable) %>

${coverable.LookupExclStartTag}
  <LookupTable code="${coverable.LinePrefix}${coverable.TypeName}Excl" entityName="${coverable.LinePrefix}${coverable.TypeName}ExclLookup" root="${coverable.LinePrefix}${coverable.TypeName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.LinePrefix}${coverable.TypeName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.LinePrefix}${coverable.TypeName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.LinePrefix}${coverable.TypeName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.LinePrefix}${coverable.TypeName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="ExclusionPatternCode"/>
  </LookupTable>
${coverable.LookupExclEndTag}
<% // needs new line to ensure next tag is on its own line %>
