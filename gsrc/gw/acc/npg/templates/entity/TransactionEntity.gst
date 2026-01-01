<% uses gw.acc.npg.model.Transaction %>
<%@ params( transaction: Transaction ) %>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${transaction.EntityName}"
  type="effdated"
  desc="${transaction.Description}"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  extendable="true"
  platform="false"
  loadable="false"
  table="${transaction.TableName}">
  <implementsEntity
    name="Transaction"/>
  <implementsInterface
    iface="gw.api.domain.financials.TransactionAdapter"
    impl="${transaction.LOBPackageName}.financials.${transaction.TransactionAdapterImplName}"/>
${EntityColumn.renderToString(transaction.FkFieldToCost)}
</entity>