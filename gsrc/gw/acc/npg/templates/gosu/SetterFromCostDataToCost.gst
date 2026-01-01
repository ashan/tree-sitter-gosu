<% uses gw.acc.npg.model.Cost %>
<% uses gw.acc.npg.model.ColumnType %>
<%@ params(cost:Cost) %>
<%for(var field in cost.AdditionalFields.where(\f -> f.Type != ColumnType.Array)){%>
<%if (field.Type == Foreignkey) {%>
    costEntity.setFieldValue("${field.Name}", ${field.Name}ID)
<%} else {%>
    costEntity.${field.Name} = ${field.Name}
<%}%>
<%}%>