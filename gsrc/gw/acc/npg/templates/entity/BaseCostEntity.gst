<% uses gw.acc.npg.model.BaseCost %>
<% uses gw.acc.npg.model.ProductLine %>
<%@ params(baseCost:BaseCost) %>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${baseCost.EntityName}"
  type="effdated"
  desc="A unit of premium or other cost (taxes, fees, etc.) for the ${baseCost.LineDisplayName} line."
  abstract="true"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  extendable="true"
  final="false"
  platform="false"
  loadable="false"
  table="${baseCost.TableName}">
  <implementsInterface
    iface="${baseCost.LOBPackageName}.financials.${baseCost.CostMethodsInterfaceName}"
    impl="${baseCost.LOBPackageName}.financials.${baseCost.CostMethodsImplName}"/>
  <implementsEntity
    name="Cost"/>
  <implementsInterface
    iface="gw.api.domain.financials.CostAdapter"
    impl="${baseCost.LOBPackageName}.financials.${baseCost.CostAdapterImplName}"/>
${EntityColumn.renderToString(baseCost.LineFKField)}
${EntityColumn.renderToString(baseCost.TransactionArrayField)}
</entity>
