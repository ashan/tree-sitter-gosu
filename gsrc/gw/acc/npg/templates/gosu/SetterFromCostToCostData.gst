<% uses gw.acc.npg.model.Cost %>
<% uses gw.acc.npg.model.ColumnType %>
<%@ params(cost:Cost) %>
<%for(var field in cost.AdditionalFields.where(\f -> f.Type != ColumnType.Array)){%>
<%if (field.Type == Foreignkey) {%>
    ${field.Name}ID = cost.${field.Name}.FixedId
<%} else {%>
    ${field.Name} = cost.${field.Name}
<%}%>
<%}%>