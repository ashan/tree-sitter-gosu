<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <Page
    afterEnter="gw.api.web.PebblesUtil.addWebMessages(CurrentLocation, policyPeriod.PolicyFileMessages)"
    canVisit="perm.PolicyPeriod.view(policyPeriod) and perm.System.pfiledetails"
    id="${productLine.PolicyFileLineCoveragesName}"
    parent="PolicyFile(policyPeriod, asOfDate)"
    title="DisplayKey.get(&quot;Web.Policy.${productLine.Abbrevation}.LineLevelCoverages&quot;)">
    <LocationEntryPoint
      signature="${productLine.PolicyFileLineCoveragesName}(policyPeriod : PolicyPeriod, asOfDate : java.util.Date)"/>
    <Variable
      name="policyPeriod"
      type="PolicyPeriod"/>
    <Variable
      name="asOfDate"
      type="java.util.Date"/>
    <Screen
      id="${productLine.PolicyFileLineCoveragesName}_Screen">
      <Variable
        initialValue="policyPeriod.${productLine.LineCode}"
        name="line"
        type="${productLine.EntityName}"/>
      <TitleBar/>
      <Toolbar/>
      <PanelSet>
        <CardViewPanel>
          <Card
            id="Coverages"
            title="DisplayKey.get(&quot;Web.Policy.Coverages&quot;)">
            <PanelRef
              def="${productLine.LineStandardCoveragesDVName}(line, false)">
              <TitleBar
                title="DisplayKey.get(&quot;Web.LineWizard.StandardCoverages&quot;)"/>
            </PanelRef>
          </Card>
          <Card
            id="AdditionalCoverages"
            title="DisplayKey.get(&quot;Web.LineWizard.AdditionalCoverages&quot;)">
            <PanelRef
              def="AdditionalCoveragesDV(line, new String[]{&quot;${productLine.AddGroupName}&quot;}, true)">
              <TitleBar
                title="DisplayKey.get(&quot;Web.LineWizard.AdditionalCoverages&quot;)"/>
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
  </Page>
</PCF>