<%
uses gw.apd.model.generate.ScheduleDataTypeHelper
%>
<%@ params(prop : APDTerm, columnNo : int) %>
<FKScheduledItemPropertyPattern
  codeIdentifier="${prop.CodeIdentifier}"
  column="${ScheduleDataTypeHelper.FIELD_TYPE_SCHED_COL_NAMES.get(APDFieldType.TC_LOCATION)}${columnNo}"
  identity="false"
  priority="${prop.Sequence}"
  propertyName="${prop.Name}"
  public-id="${prop.ScheduledItemPropertyPublicId}"
  valueRangeGetter="gw.lob.common.schedule.valuerangegetters.PolicyLocationValueRangeGetter"
  required="false"/>