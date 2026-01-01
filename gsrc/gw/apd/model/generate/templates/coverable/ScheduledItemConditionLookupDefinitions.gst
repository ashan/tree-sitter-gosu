<%@ params(coverable:APDCoverable) %>

${coverable.LookupSchItemCondStartTag}
  <LookupTable code="${coverable.QualifiedName}ScheduleCondItemCond" entityName="${coverable.QualifiedName}CondLookup" root="${coverable.QualifiedName}ScheduleCondItem">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.QualifiedName}ScheduleCondItem.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.QualifiedName}ScheduleCondItem.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.QualifiedName}ScheduleCondItem.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.QualifiedName}ScheduleCondItem.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="ConditionPatternCode"/>
  </LookupTable>
${coverable.LookupSchItemCondEndTag}
<% // needs new line to ensure next tag is on its own line %>
