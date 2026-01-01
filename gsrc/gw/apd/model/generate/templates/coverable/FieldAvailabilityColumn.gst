<% uses gw.apd.util.APDStringUtil %>
<%@ params(field : APDAttribute) %>
<%
var fieldName = field.Name
var columnName = fieldName + "Avl"

var dbColumnName = "Avl_${APDStringUtil.makeHash(fieldName)}"
%>
  <column
    name="${columnName}"
    columnName="${dbColumnName}"
    desc="whether or not the ${fieldName} field was available the last time availability was checked"
    nullok="true"
    type="bit"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>