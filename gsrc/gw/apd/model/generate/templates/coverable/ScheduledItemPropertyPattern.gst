<%
uses gw.apd.model.generate.ScheduleDataTypeHelper
%>
<%@ params(prop : APDTerm, columnNo : int) %>
<ScheduledItemPropertyPattern
  codeIdentifier="${prop.CodeIdentifier}"
  column="${ScheduleDataTypeHelper.FIELD_TYPE_SCHED_COL_NAMES.get(prop.Type)}${columnNo}"
  identity="false"
  priority="${prop.Sequence}"
  propertyName="${prop.Name}"
  public-id="${prop.ScheduledItemPropertyPublicId}"
  required="false"/>
