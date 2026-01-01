<% uses gw.acc.npg.model.Transaction %>
<%@ params( transaction: Transaction) %>
<?xml version="1.0"?>
<Entity
  name="${transaction.EntityName}">
  <Columns>
    <Column
      beanPath="${transaction.EntityName}.${transaction.FkFieldToCost.Name}"
      name="cost"/>
  </Columns>
  <DisplayName><![CDATA[cost]]></DisplayName>
</Entity>

