<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable: Coverable) %>
<!-- ${coverable.EntityName} -->

  <LookupTable code="${coverable.Coverage.EntityName}" entityName="CoverageLookup" root="${coverable.EntityName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.EntityName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.EntityName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.EntityName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.EntityName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CoveragePatternCode"/>
  </LookupTable>

  <LookupTable code="${coverable.Coverage.EntityName}Term" entityName="CovTermLookup" root="${coverable.EntityName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.EntityName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.EntityName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.EntityName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.EntityName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermPatternCode"/>
  </LookupTable>

  <LookupTable code="${coverable.Coverage.EntityName}Opt" entityName="CovTermOptLookup" root="gw.api.domain.covterm.CovTerm" appliesTo="${coverable.EntityName}">
    <Filter field="CovTermPatternCode" valuePath="CovTerm.PatternCode"/>
    <Filter field="Currency" valuePath="CovTerm.Clause.Currency" exactMatch="false"/>
    <Dimension field="State" valuePath="CovTerm.Clause.OwningCoverable.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="CovTerm.Clause.PolicyLine.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="CovTerm.Clause.PolicyLine.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermOptCode"/>
  </LookupTable>

  <LookupTable code="${coverable.Coverage.EntityName}Pack" entityName="CovTermPackLookup" root="gw.api.domain.covterm.CovTerm" appliesTo="${coverable.EntityName}">
    <Filter field="CovTermPatternCode" valuePath="CovTerm.PatternCode"/>
    <Filter field="Currency" valuePath="CovTerm.Clause.Currency" exactMatch="false"/>
    <Dimension field="State" valuePath="CovTerm.Clause.OwningCoverable.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="CovTerm.Clause.PolicyLine.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="CovTerm.Clause.PolicyLine.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="CovTermPackCode"/>
  </LookupTable>

<%if(coverable.IncludeExclusion){%>
  <!-- Exclusion -->
  <LookupTable code="${coverable.Exclusion.EntityName}" entityName="ExclusionLookup" root="${coverable.EntityName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.EntityName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.EntityName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.EntityName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.EntityName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="ExclusionPatternCode"/>
  </LookupTable>
<%}%>

<%if(coverable.IncludeCondition){%>
  <!-- Condition -->
  <LookupTable code="${coverable.Condition.EntityName}" entityName="ConditionLookup" root="${coverable.EntityName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.EntityName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.EntityName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.EntityName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.EntityName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="ConditionPatternCode"/>
  </LookupTable>
<%}%>

<%if(coverable.IncludeModifier){%>
  <!-- Modifier -->
  <LookupTable code="${coverable.Modifier.EntityName}" entityName="ModifierLookup" root="${coverable.EntityName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.EntityName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.EntityName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.EntityName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.EntityName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="ModifierPatternCode"/>
  </LookupTable>

  <LookupTable code="${coverable.RateFactor.EntityName}" entityName="RateFactorLookup" root="${coverable.EntityName}">
    <Filter field="PolicyLinePatternCode" valuePath="${coverable.EntityName}.PolicyLine.PatternCode"/>
    <Dimension field="State" valuePath="${coverable.EntityName}.CoverableState" precedence="0"/>
    <Dimension field="UWCompanyCode" valuePath="${coverable.EntityName}.Branch.UWCompany.Code" precedence="1"/>
    <Dimension field="JobType" valuePath="${coverable.EntityName}.Branch.Job.Subtype" precedence="2"/>
    <DistinguishingField field="RateFactorPatternCode"/>
  </LookupTable>
<%}%>
