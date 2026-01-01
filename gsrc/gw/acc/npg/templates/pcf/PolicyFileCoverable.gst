<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable: Coverable) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <Page
    afterEnter="gw.api.web.PebblesUtil.addWebMessages(CurrentLocation, policyPeriod.PolicyFileMessages)"
    canVisit="perm.PolicyPeriod.view(policyPeriod) and perm.System.pfiledetails"
    id="${coverable.PolicyFileCoverableName}"
    parent="PolicyFile(policyPeriod, asOfDate)"
    title="DisplayKey.get(&quot;Web.Policy.${coverable.Abbrevation}.${coverable.EntityNameWithoutSuffix}.NamePlural&quot;)">
    <LocationEntryPoint
      signature="${coverable.PolicyFileCoverableName}(policyPeriod : PolicyPeriod, asOfDate : java.util.Date)"/>
    <Variable
      name="policyPeriod"
      type="PolicyPeriod"/>
    <Variable
      name="asOfDate"
      type="java.util.Date"/>
    <Screen
      id="${coverable.PolicyFileCoverableScreenName}">
      <TitleBar/>
      <Toolbar/>
      <PanelRef
        def="${coverable.CoverablePanelSetName}(policyPeriod, policyPeriod.${coverable.LineEntityNameWithoutSuffix}, false, null)"/>
    </Screen>
  </Page>
</PCF>