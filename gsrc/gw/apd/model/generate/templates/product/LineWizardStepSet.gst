<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@params(product: APDProduct, fieldMax : int)%>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <WizardStepSet
    id="LineWizardStepSet"
    mode="${product.CodeIdentifier}">
    <Require
      name="job"
      type="Job"/>
    <Require
      name="policyPeriod"
      type="PolicyPeriod"/>
    <Require
      name="jobWizardHelper"
      type="gw.api.web.job.JobWizardHelper"/>
    <Require
      name="openForEdit"
      type="boolean"/>
<%if(product.ProductLines.Count > 1) {%>
    <JobWizardStep
      id="LineSelection"
      onExit="jobWizardHelper.reloadPolicyPeriodIfAsyncQuoteComplete(policyPeriod)"
      save="openForEdit"
      screen="LineSelectionScreen(policyPeriod, openForEdit, jobWizardHelper)"
      title="DisplayKey.get(&quot;Web.LineWizardMenu.Common.LineSelection&quot;)"/>
<%}%>
<%if(product.UsesLocationListView) {%>
    <JobWizardStep
      beforeSave="gw.policy.PolicyLocationValidation.validateLocationsStep(policyPeriod.PolicyLocations)"
      id="Locations"
      save="policyPeriod.OpenForEdit"
      screen="LocationsScreen(policyPeriod, openForEdit, jobWizardHelper, policyPeriod.SupportsNonSpecificLocations)"
      title="DisplayKey.get(&quot;Web.LineWizardMenu.Locations&quot;)"/>
<%}%>
<%for(line in product.ProductLines*.ProductLine.sort(TemplateComparators.CoverableOrdering)) {%>
    <WizardStepGroup
      collapseIfNotCurrent="true"
      id="${line.LinePrefix}WizardStepGroup"
      label="DisplayKey.get(&quot;Web.LineWizardMenu.${product.CodeIdentifier}.${line.CodeIdentifier}&quot;)"
      visible="policyPeriod.${line.CodeIdentifier}Exists">
<%if(line.Fields.Count > 0 or line.ChildCoverables.Count == 1 or line.Exposures.Count > 0 or line.Clauses.Count > 0) {%>
      <JobWizardStep
        id="${line.LinePrefix.concat(line.TypeName)}Screen"
<%if (line.ContainsSplittableAttribute) {%>
        onChange="policyPeriod.${line.CodeIdentifier}.syncSplittableFields()"
<%}%>
<%
var onEnterAttribute = gw.apd.model.generate.RiskEntityUIPageGenerationHelper
    .generateOnEnterAttribute(line, fieldMax, "policyPeriod.${line.CodeIdentifier}")
%>
        onEnter="${onEnterAttribute}"
        save="policyPeriod.OpenForEdit"
        screen="${line.LinePrefix.concat(line.TypeName)}Screen(policyPeriod.${line.CodeIdentifier}, openForEdit, jobWizardHelper)"
        title="DisplayKey.get(&quot;Web.Policy.${line.LinePrefix}.${line.LinePrefix.concat(line.TypeName)}Screen&quot;)"/>
<%}%>
<%if(line.Fields.Count > fieldMax or line.Fields.Count == 0 or line.ChildCoverables.Count > 1 or line.Exposures.Count > 0)  // too many line level fields to combine line and children on one screen so separate wizardstep
  for(child in line.ChildCoverables.sort(TemplateComparators.CoverableOrdering)) {
    var onEnterAttribute = gw.apd.model.generate.RiskEntityUIPageGenerationHelper
      .generateCoverableSync(child, "policyPeriod.${line.CodeIdentifier}")
%>
      <JobWizardStep
        id="${line.LinePrefix.concat(child.TypeName)}"
<%if (onEnterAttribute.HasContent) {%>
        onEnter="${onEnterAttribute}"
<%}%>
        save="policyPeriod.OpenForEdit"
        screen="${line.LinePrefix.concat(child.TypeName)}Screen(policyPeriod.${line.CodeIdentifier}, openForEdit, jobWizardHelper)"
        title="DisplayKey.get(&quot;Web.Policy.${line.LinePrefix}.${line.LinePrefix.concat(child.TypeName)}Screen&quot;)"/>
<%}%>
    </WizardStepGroup>
<%}%>
  </WizardStepSet>
</PCF>