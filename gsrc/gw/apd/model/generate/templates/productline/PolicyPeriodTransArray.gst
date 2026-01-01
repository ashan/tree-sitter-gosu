<%@ params(productLine:APDProductLine) %>
<array arrayentity="${productLine.LinePrefix}Transaction"
         cascadeDelete="true"
         name="${productLine.LinePrefix}Transactions"/>
<% // needs new line line to ensure instert tag get onto its own line%>