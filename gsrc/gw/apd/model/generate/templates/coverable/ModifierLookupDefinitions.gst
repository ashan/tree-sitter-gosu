<%@ params(coverable:APDCoverable) %>
${coverable.LookupModStartTag}
  <LookupTable code="${coverable.LinePrefix}${coverable.TypeName}Mod" entityName="${coverable.LinePrefix}${coverable.TypeName}ModLookup" root="${coverable.LinePrefix}${coverable.TypeName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.LinePrefix}${coverable.TypeName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.LinePrefix}${coverable.TypeName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.LinePrefix}${coverable.TypeName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.LinePrefix}${coverable.TypeName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="ModifierPatternCode"/>
  </LookupTable>
  <LookupTable code="${coverable.LinePrefix}${coverable.TypeName}MF" entityName="RateFactorLookup" root="${coverable.LinePrefix}${coverable.TypeName}MF">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.LinePrefix}${coverable.TypeName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.LinePrefix}${coverable.TypeName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.LinePrefix}${coverable.TypeName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.LinePrefix}${coverable.TypeName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="RateFactorPatternCode"/>
  </LookupTable>
${coverable.LookupModEndTag}