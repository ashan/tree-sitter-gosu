<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <PanelSet
    id="${productLine.PolicyLineSummaryPanelSetName}"
    mode="${productLine.LineCode}">
    <Require
      name="line"
      type="PolicyLine"/>
    <Require
      name="jobWizardHelper"
      type="gw.api.web.job.JobWizardHelper"/>
    <Variable
      initialValue="line as ${productLine.EntityName}"
      name="${productLine.AbbrevationLowerCase}line"
      type="${productLine.EntityName}"/>
  </PanelSet>
</PCF>