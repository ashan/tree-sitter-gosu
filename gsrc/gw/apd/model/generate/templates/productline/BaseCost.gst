<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
var extPackage = "${productLine.LOBPackageName}.${APDConstants.FINANCIALS}"
%>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  abstract="true"
  desc="A unit of premium or other cost (taxes, fees, etc.) for the ${productLine.Name} line."
  effDatedBranchType="PolicyPeriod"
  entity="${productLine.LinePrefix}Cost"
  exportable="true"
  final="false"
  loadable="false"
  table="${productLine.LinePrefix.toLowerCase()}cost"
  type="effdated">
  <implementsEntity
    name="Cost"/>
  <implementsInterface
    iface="gw.api.domain.financials.CostAdapter"
    impl="${extPackage}.${productLine.LinePrefix}CostAdapter"/>
  <implementsInterface
    iface="${basePackage}.${productLine.LinePrefix}CostMethods"
    impl="${extPackage}.${productLine.LinePrefix}CostMethodsImpl"/>
  <foreignkey
    fkentity="${productLine.QualifiedName}"
    name="${productLine.QualifiedName}"
    nullok="false"/>
  <array
    arrayentity="${productLine.LinePrefix}Transaction"
    cascadeDelete="true"
    getterScriptability="doesNotExist"
    name="Transactions"
    setterScriptability="hidden"/>
</entity>
