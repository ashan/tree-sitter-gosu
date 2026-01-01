<%
uses gw.apd.model.generate.ScheduleDataTypeHelper
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params( line : APDProductLine) %>
<% var maxFieldCountByDataType = ScheduleDataTypeHelper.calculateScheduleFieldTypeCounts(line) %>
<?xml version="1.0"?>
<delegate
  xmlns="http://guidewire.com/datamodel"
  extendable="true"
  name="${line.LinePrefix}ScheduledItem"
  requiresType="effdated">
<% for (fieldType in ScheduleDataTypeHelper.FIELD_TYPE_SCHED_SUPPORTED_FOR_CODEGEN.toTypedArray().sort(TemplateComparators.TypekeyOrdering)) {%>
  <% for (i in 1..|maxFieldCountByDataType.get(fieldType)+1) { %>
    <% var columnName = ScheduleDataTypeHelper.FIELD_TYPE_SCHED_COL_NAMES.get(fieldType)+i  %>
    <% if (!entity.ScheduledItem.TypeInfo.Properties*.Name.contains(columnName)) { %>
      <% if (fieldType == APDFieldType.TC_LOCATION ||  fieldType == APDFieldType.TC_PARTY) { %>
       <foreignkey
         desc="${fieldType.DisplayName} column field${i}"
         fkentity="${ScheduleDataTypeHelper.FIELD_TYPE_SCHED_DATA_TYPES.get(fieldType)}"
         name="${columnName}"
         nullok="true"/>
      <% } else {%>
        <column
          desc="${fieldType.DisplayName} column field${i}"
          getterScriptability="doesNotExist"
          name="${columnName}"
          nullok="true"
          setterScriptability="doesNotExist"
          type="${ScheduleDataTypeHelper.FIELD_TYPE_SCHED_DATA_TYPES.get(fieldType)}"/>
      <% } %>
    <% } %>
  <% } %>
<% } %>
  <fulldescription><![CDATA[A ${line.LinePrefix} scheduled item]]></fulldescription>
</delegate>