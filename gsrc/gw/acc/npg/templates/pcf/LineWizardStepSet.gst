<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <WizardStepSet
    id="LineWizardStepSet"
    mode="${productLine.ProductCode}">
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
    <JobWizardStep
      beforeSave="gw.policy.PolicyLocationValidation.validateLocationsStep(policyPeriod.PolicyLocations)"
      id="Locations"
      save="policyPeriod.OpenForEdit"
      screen="LocationsScreen(policyPeriod, openForEdit, jobWizardHelper, policyPeriod.${productLine.LineCode}.SupportsNonSpecificLocations)"
      title="DisplayKey.get(&quot;Web.LineWizardMenu.Locations&quot;)"/>
    <JobWizardStep
      id="LineCoverages"
      onEnter="if (openForEdit) { gw.web.productmodel.ProductModelSyncIssuesHandler.sync(policyPeriod.${productLine.LineCode}.AllCoverables, policyPeriod.${productLine.LineCode}.AllModifiables, null, policyPeriod, jobWizardHelper) }"
      save="policyPeriod.OpenForEdit"
      screen="${productLine.LineCoveragesScreenName}(policyPeriod, openForEdit, jobWizardHelper)"
      title="DisplayKey.get(&quot;Web.Policy.${productLine.Abbrevation}.LineLevelCoverages&quot;)"/>
<%for(coverable in productLine.Coverables){%>
<%if(coverable.ReferredFromCoverable!=null and coverable.ReferredFromCoverable typeis ProductLine){%>
    <JobWizardStep
      id="${coverable.EntityNameWithoutSuffix}"
      save="policyPeriod.OpenForEdit"
      screen="${coverable.CoverableScreenName}(policyPeriod, openForEdit,jobWizardHelper)"
      title="DisplayKey.get(&quot;Web.LineWizardMenu.${productLine.Abbrevation}.${coverable.CoverableScreenName}&quot;)"/>
<%}%>
<%}%>
  </WizardStepSet>
</PCF>