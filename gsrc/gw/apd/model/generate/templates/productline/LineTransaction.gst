<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants
uses org.apache.commons.lang.StringEscapeUtils

var extPackage = "${productLine.LOBPackageName}.${APDConstants.FINANCIALS}"
%>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${productLine.LinePrefix}Transaction"
  type="effdated"
  desc="A transaction for the ${StringEscapeUtils.escapeXml(productLine.Name)} line."
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  extendable="true"
  platform="false"
  loadable="false"
  table="${productLine.LinePrefix.toLowerCase()}transaction">
  <implementsEntity
    name="Transaction"/>
  <implementsInterface
    iface="gw.api.domain.financials.TransactionAdapter"
    impl="${extPackage}.${productLine.LinePrefix}TransactionAdapter"/>
  <foreignkey
    desc="The cost this transaction modifies."
    fkentity="${productLine.LinePrefix}Cost"
    name="Cost"
    nonEffDated="true"
    nullok="false"/>
</entity>
