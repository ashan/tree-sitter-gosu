<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine:ProductLine) %>
  <array arrayentity="${productLine.Transaction.EntityName}"
         cascadeDelete="true"
         name="${productLine.TransactionArrayColumnName}"/>
