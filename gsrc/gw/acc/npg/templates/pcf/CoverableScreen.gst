<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable: Coverable) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <Screen
    editable="openForEdit"
    id="${coverable.CoverableScreenName}">
    <Require
      name="policyPeriod"
      type="PolicyPeriod"/>
    <Require
      name="openForEdit"
      type="boolean"/>
    <Require
      name="jobWizardHelper"
      type="gw.api.web.job.JobWizardHelper"/>
    <Variable
      initialValue="policyPeriod.Job"
      name="job"
      type="Job"/>
    <Toolbar>
      <WizardButtons/>
      <ToolbarButtonSetRef
        mode="job.Subtype"
        toolbarButtonSet="JobWizardToolbarButtonSet(policyPeriod, job, jobWizardHelper)"/>
    </Toolbar>
    <PanelRef
      def="OOSEPanelSet(policyPeriod, jobWizardHelper)"/>
    <PanelRef
      def="${coverable.CoverablePanelSetName}(policyPeriod, policyPeriod.${coverable.LineEntityNameWithoutSuffix}, openForEdit, jobWizardHelper)"/>
  </Screen>
</PCF>