<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <MenuItemSet
    id="${productLine.PolicyMenuItemSetName}"
    mode="${productLine.ProductCode}">
    <Require
      name="period"
      type="PolicyPeriod"/>
    <Require
      name="asOfDate"
      type="java.util.Date"/>
    <MenuItem
      action="PolicyFile_PolicyInfo.go(period, asOfDate)"
      id="${productLine.PolicyMenuItemSetName}_PolicyInfo"
      label="DisplayKey.get(&quot;Web.PolicyFile.PolicyInfo&quot;)"/>
    <MenuItem
      action="PolicyFile_Locations.go(period, asOfDate)"
      id="${productLine.PolicyMenuItemSetName}_Locations"
      label="DisplayKey.get(&quot;Web.PolicyFile.Locations&quot;)"/>
    <MenuItem
      action="${productLine.PolicyFileLineCoveragesName}.go(period, asOfDate)"
      id="${productLine.PolicyMenuItemSetName}_LineCoverages"
      label="DisplayKey.get(&quot;Web.Policy.${productLine.Abbrevation}.LineLevelCoverages&quot;)"/>
<%for(var coverable in productLine.Coverables){%>
<%if(coverable.ReferredFromCoverable!=null and coverable.ReferredFromCoverable typeis ProductLine){%>
    <MenuItem
      action="${coverable.PolicyFileCoverableName}.go(period, asOfDate)"
      id="${coverable.EntityNameWithoutSuffix}"
      label="DisplayKey.get(&quot;Web.PolicyFile.${productLine.Abbrevation}.${coverable.PolicyFileName}&quot;)"/>
<%}%>
<%}%>
    <MenuItem
      action="PolicyFile_Pricing.go(period, asOfDate)"
      id="${productLine.PolicyMenuItemSetName}_Pricing"
      label="DisplayKey.get(&quot;Web.PolicyFile.Pricing&quot;)"/>
    <MenuItem
      action="${productLine.PolicyFileFormsName}.go(period, asOfDate)"
      id="${productLine.PolicyMenuItemSetName}_Endorsements"
      label="DisplayKey.get(&quot;Web.PolicyFile.Endorsements&quot;)"/>
  </MenuItemSet>
</PCF>