<% uses gw.acc.npg.model.Cost %>
<% uses gw.acc.npg.model.ColumnType %>
<%@ params(cost:Cost) %>
<%var extraCostKeyFields = cost.AdditionalFields.where(\f -> (f.Type != ColumnType.Array and f.CostKeyField))
var commarSeperatedFields = extraCostKeyFields.map(\elt -> elt.Type == ColumnType.Foreignkey ? "${elt.Name}ID" : elt.Name).join(",")
if(extraCostKeyFields.HasElements){%>
${commarSeperatedFields}
<%}%>