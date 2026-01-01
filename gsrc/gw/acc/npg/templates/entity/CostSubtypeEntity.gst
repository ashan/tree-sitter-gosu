<% uses gw.acc.npg.model.Cost %>
<%@ params(cost:Cost) %>
<?xml version="1.0"?>
<subtype
  xmlns="http://guidewire.com/datamodel"
  entity="${cost.EntityName}"
  desc="${cost.Description}"
  supertype="${cost.SuperEntity}">
<% if(cost.Coverable!=null){%>
  <implementsInterface
    iface="${cost.LOBPackageName}.financials.${cost.CostMethodsInterfaceName}"
    impl="${cost.LOBPackageName}.financials.${cost.CostMethodsImplName}"/>
<%}%>
  <implementsEntity
    name="Cost"/>
  <implementsInterface
    iface="gw.api.domain.financials.CostAdapter"
    impl="${cost.LOBPackageName}.financials.${cost.CostAdapterImplName}"/>
<% if(cost.Coverage!=null){%>
${EntityColumn.renderToString(cost.CoverageFkField)}
<%}%>
<% if(cost.AttachToCoverable){%>
${EntityColumn.renderToString(cost.CoverableFkField)}
<%}%>
<%for(var field in cost.AdditionalFields){%>
${EntityColumn.renderToString(field)}
<%}%>
</subtype>
