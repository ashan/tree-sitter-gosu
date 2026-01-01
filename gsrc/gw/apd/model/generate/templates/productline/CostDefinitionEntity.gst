<%uses gw.apd.model.generate.templates.coverable.CoverableDelegate
uses org.apache.commons.lang.StringEscapeUtils %>
<%@ params(productLine:APDProductLine)%>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${productLine.LinePrefix}CostDefinition"
  type="retireable"
  desc="Cost definition details for ${productLine.LinePrefix} line"
  exportable="true"
  final="false"
  platform="false"
  loadable="false"
  table="${productLine.LinePrefix.toLowerCase()}costdefinition">
  <column
    name="LookupKey"
    desc="Identifying key for cost definiton lookup"
    nullok="false"
    type="shorttext"/>
  <column
    name="LookupType"
    desc="Lookup type for cost definition owner. Should match code in APDCostDefinitionType typelist"
    nullok="false"
    type="shorttext"/>
  <column
    name="SeparateBilling"
    nullok="false"
    type="bit"/>
  <column
    name="SeparateCollection"
    nullok="false"
    type="bit"/>
</entity>