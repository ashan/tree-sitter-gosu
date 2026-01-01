<%
uses gw.apd.model.generate.templates.TemplateComparators
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(costCodes: CostCode[]) %>
<?xml version="1.0"?>
<import>
<%for (costCode in costCodes.sort(TemplateComparators.CostCodeOrdering)) {%>
  <CostCode public-id="${costCode.PublicID?:costCode.CostCode}">
    <ChargePatern>${costCode.ChargePatern.Code}</ChargePatern>
    <CostCode>${costCode.CostCode}</CostCode>
    <CostName>${costCode.CostName}</CostName>
    <Description>${ StringEscapeUtils.escapeXml(costCode.Description)}</Description>
    <Overrideable>${costCode.Overrideable}</Overrideable>
    <ProrationMethod>${costCode.ProrationMethod.Code}</ProrationMethod>
    <RateAmountType>${costCode.RateAmountType.Code}</RateAmountType>
  </CostCode>
<%}%>
</import>