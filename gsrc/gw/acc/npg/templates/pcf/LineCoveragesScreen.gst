<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <Screen
    editable="openForEdit"
    id="${productLine.LineCoveragesScreenName}">
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
      initialValue="policyPeriod.${productLine.LineCode}"
      name="line"
      type="${productLine.EntityName}"/>
    <Toolbar>
      <WizardButtons/>
      <ToolbarButtonSetRef
        mode="policyPeriod.Job.Subtype"
        toolbarButtonSet="JobWizardToolbarButtonSet(policyPeriod, policyPeriod.Job, jobWizardHelper)"/>
    </Toolbar>
    <PanelSet>
      <PanelRef
        def="OOSEPanelSet(policyPeriod, jobWizardHelper)"/>
      <CardViewPanel>
        <Card
          id="Coverages"
          title="DisplayKey.get(&quot;Web.Policy.Coverages&quot;)">
          <PanelRef
            def="${productLine.LineStandardCoveragesDVName}(line, openForEdit)">
            <TitleBar
              title="DisplayKey.get(&quot;Web.LineWizard.StandardCoverages&quot;)"/>
          </PanelRef>
        </Card>
        <Card
          id="AdditionalCoverages"
          title="DisplayKey.get(&quot;Web.LineWizard.AdditionalCoverages&quot;)">
          <PanelRef
            def="AdditionalCoveragesPanelSet(line, new String[]{&quot;${productLine.AddGroupName}&quot;}, true)">
            <TitleBar
              title="DisplayKey.get(&quot;Web.LineWizard.AdditionalCoverages&quot;)"/>
            <Toolbar/>
          </PanelRef>
        </Card>
<%if(productLine.IncludeCondition or productLine.IncludeExclusion){%>
        <Card
          id="exclusionsAndConditionsCard"
          title="DisplayKey.get(&quot;Web.LineWizard.ExclusionsAndConditions&quot;)">
          <PanelRef
            def="AdditionalExclusionsAndConditionsPanelSet(line, new String[] {&quot;${productLine.ExclusionGroupName}&quot;, &quot;${productLine.ConditionGroupName}&quot;}, true)"
            id="policyLevelExclusionsAndConditions"/>
        </Card>
<%}%>
      </CardViewPanel>
    </PanelSet>
  </Screen>
</PCF>