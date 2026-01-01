<%
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(costCategories: APDClaimCostCategory[]) %>
<?xml version="1.0"?>
<import>
<%for (costCategory in costCategories.orderBy(\cc -> cc.PublicID)) {%>
  <CostCode public-id="${costCategory.PublicID}">
    <CodeIdentifier>${costCategory.CodeIdentifier}</CodeIdentifier>
    <CostType>${costCategory.CostType.Code}</CostType>
    <Name>${costCategory.Name}</Name>
    <Description>${ StringEscapeUtils.escapeXml(costCategory.Description)}</Description>
  </CostCode>
<%}%>
</import>