<%@ params(coverable:APDCoverable) %>

${coverable.LookupSchItemExclStartTag}
  <LookupTable code="${coverable.QualifiedName}ScheduleExclItemExcl" entityName="${coverable.QualifiedName}ExclLookup" root="${coverable.QualifiedName}ScheduleExclItem">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.QualifiedName}ScheduleExclItem.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.QualifiedName}ScheduleExclItem.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.QualifiedName}ScheduleExclItem.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.QualifiedName}ScheduleExclItem.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="ExclusionPatternCode"/>
  </LookupTable>
${coverable.LookupSchItemExclEndTag}
<% // needs new line to ensure next tag is on its own line %>
