<%
uses gw.apd.model.generate.ScheduleDataTypeHelper
%>
<%@ params(prop : APDTerm, columnNo : int) %>
<FKScheduledItemPropertyPattern
  codeIdentifier="${prop.CodeIdentifier}"
  column="${ScheduleDataTypeHelper.FIELD_TYPE_SCHED_COL_NAMES.get(APDFieldType.TC_PARTY)}${columnNo}"
  identity="false"
  priority="${prop.Sequence}"
  propertyName="${prop.Name}"
  public-id="${prop.ScheduledItemPropertyPublicId}"
  valueRangeGetter="gw.apd.schedule.APDInvolvedPartyValueRangeGetter"
  required="false"/>