<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@params(product: APDProduct, fieldMax : int)%>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <MenuItemSet
    id="PolicyMenuItemSet"
    mode="${product.CodeIdentifier}">
    <Require
      name="period"
      type="PolicyPeriod"/>
    <Require
      name="asOfDate"
      type="java.util.Date"/>
    <MenuItem
      action="PolicyFile_PolicyInfo.go(period, asOfDate)"
      id="PolicyMenuItemSet_PolicyInfo"
      label="DisplayKey.get(&quot;Web.PolicyFile.PolicyInfo&quot;)"/>
<%if(product.UsesLocationListView) {%>
    <MenuItem
      action="PolicyFile_Locations.go(period, asOfDate)"
      id="PolicyMenuItemSet_Locations"
      label="DisplayKey.get(&quot;Web.PolicyFile.Locations&quot;)"/>
<%}%>
<%for(line in product.ProductLines*.ProductLine.sort(TemplateComparators.CoverableOrdering)) {%>
    <MenuItem
      action="${line.CodeIdentifier}Links.go(period, asOfDate)"
      id="PolicyMenuItemSet_${line.CodeIdentifier}"
      label="DisplayKey.get(&quot;Web.PolicyFile.ProductLine.${product.CodeIdentifier}.${line.CodeIdentifier}&quot;)"
      visible="period.${line.CodeIdentifier}Exists">
<%if(line.Fields.Count > 0 or line.ChildCoverables.Count == 1 or line.Exposures.Count > 0 or line.Clauses.Count > 0) {%>
      <MenuItem
        action="PolicyFile_${line.LinePrefix.concat(line.TypeName)}.go(period, asOfDate)"
        id="PolicyMenuItemSet_${line.LinePrefix.concat(line.TypeName)}"
        label="DisplayKey.get(&quot;Web.PolicyFile.${line.LinePrefix}.${line.LinePrefix.concat(line.TypeName)}&quot;)"/>
<%}%>
<%if(line.Fields.Count > fieldMax or line.Fields.Count == 0 or line.ChildCoverables.Count > 1 or line.Exposures.Count > 0)  // too many line level fields to combine line and children or main screen not used
  for(child in line.ChildCoverables.orderBy(\cc -> cc.Name) index i) {%>
      <MenuItem
        action="PolicyFile_${line.LinePrefix.concat(child.TypeName)}.go(period, asOfDate)"
        id="PolicyMenuItemSet_${line.LinePrefix.concat(child.TypeName)}"
        label="DisplayKey.get(&quot;Web.PolicyFile.${line.LinePrefix}.${line.LinePrefix.concat(child.TypeName)}&quot;)"/>
<%}%>
    </MenuItem>
<%}%>
    <MenuItem
      action="PolicyFile_Pricing.go(period, asOfDate)"
      id="PolicyMenuItemSet_Pricing"
      label="DisplayKey.get(&quot;Web.PolicyFile.Pricing&quot;)"/>
  </MenuItemSet>
</PCF>