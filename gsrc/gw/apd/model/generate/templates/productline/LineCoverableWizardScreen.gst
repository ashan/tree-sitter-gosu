<%
uses entity.APDCoverable
%>
<%@params(productLine : APDProductLine, coverable : APDCoverable)%>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <Screen
    editable="openForEdit"
    id="${coverable.LinePrefix+coverable.TypeName}Screen">
    <Require
      name="${productLine.TypeName.uncapitalize()}"
      type="entity.${productLine.LinePrefix+productLine.TypeName}"/>
    <Require
      name="openForEdit"
      type="boolean"/>
    <Require
      name="jobWizardHelper"
      type="gw.api.web.job.JobWizardHelper"/>
    <Toolbar>
      <WizardButtons/>
      <ToolbarButtonSetRef
        mode="${productLine.TypeName.uncapitalize()}.Branch.Job.Subtype"
        toolbarButtonSet="JobWizardToolbarButtonSet(${productLine.TypeName.uncapitalize()}.Branch, ${productLine.TypeName.uncapitalize()}.Branch.Job, jobWizardHelper)"/>
    </Toolbar>
    <PanelRef
      def="OOSEPanelSet(${productLine.TypeName.uncapitalize()}.Branch, jobWizardHelper)"/>
    <PanelRef
<%if (productLine == coverable) {%>
      def="${productLine.LinePrefix+coverable.TypeName}PanelSet(${productLine.TypeName.uncapitalize()}, openForEdit, jobWizardHelper)"/>
<%} else {%>
      def="${productLine.LinePrefix+coverable.TypeName}ListPanelSet(${productLine.TypeName.uncapitalize()}, openForEdit, jobWizardHelper)"/>
<%}%>
  </Screen>
</PCF>