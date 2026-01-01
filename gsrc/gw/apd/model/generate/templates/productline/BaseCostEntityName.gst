<%
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(line:APDProductLine) %>
<Entity
  name="${line.LinePrefix}Cost">
  <Columns>
    <Column
      beanPath="${line.LinePrefix}Cost.Coverage.Pattern"
      name="Pattern"/>
    <Column
      beanPath="${line.LinePrefix}Cost.Coverable"
      name="Coverable"/>
    <Column
      beanPath="${line.LinePrefix}Cost.CostCode.CostName"
      name="CostCode"/>
  </Columns>
  <DisplayName><![CDATA[
    if (Pattern != null) {
      return DisplayKey.get("Web.APDCost.CostDisplayName", CostCode, Pattern.DisplayName)
    } else {
      return DisplayKey.get("Web.APDCost.CostDisplayName", CostCode, Coverable.DisplayName)
    }
  ]]></DisplayName>
</Entity>