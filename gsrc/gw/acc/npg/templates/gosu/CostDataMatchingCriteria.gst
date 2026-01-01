<% uses gw.acc.npg.model.Cost %>
<% uses gw.acc.npg.model.ColumnType %>
<%@ params(cost:Cost) %>
<%for(var field in cost.AdditionalFields.where(\f -> (f.Type != ColumnType.Array and f.CostKeyField))){
if ("Key"==field.GosuDataType){%>
           and (v1.${field.Name}.FixedId == ${field.Name}ID)
<%} else if ("String"==field.GosuDataType){%>
           and ((v1.${field.Name}==null and ${field.Name}==null) or (v1.${field.Name}!=null and (v1.${field.Name}.equalsIgnoreCase(${field.Name}))))
<%} else if ("java.util.Date"==field.GosuDataType){%>
           and ((v1.${field.Name}==null and ${field.Name}==null) or (v1.${field.Name}!=null and (v1.${field.Name}.equals(${field.Name}))))
<%} else if ("java.math.BigDecimal"==field.GosuDataType){%>
           and ((v1.${field.Name}==null and ${field.Name}==null) or (v1.${field.Name}!=null and (v1.${field.Name}.compareTo(${field.Name})==0)))
<%} else { %>
           and (v1.${field.Name} == ${field.Name})
<%}}%>