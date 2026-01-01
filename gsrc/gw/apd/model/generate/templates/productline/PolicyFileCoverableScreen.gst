<%@ params(productLine:APDProductLine, coverable:APDCoverable) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <Screen
    id="PolicyFile_${coverable.LinePrefix+coverable.TypeName}Screen">
    <Require
      name="${productLine.TypeName.uncapitalize()}"
      type="entity.${productLine.LinePrefix+productLine.TypeName}"/>
    <PanelRef
<% if(productLine == coverable) {%>
      def="${productLine.LinePrefix+coverable.TypeName}PanelSet(${productLine.TypeName.uncapitalize()}, false, null)"/>
<%} else {%>
      def="${productLine.LinePrefix+coverable.TypeName}ListPanelSet(${productLine.TypeName.uncapitalize()}, false, null)"/>
<%}%>
  </Screen>
</PCF>