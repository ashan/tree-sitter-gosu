<%
uses gw.apd.model.generate.ScheduleDataTypeHelper
%>
<%@ params(prop : APDTerm, columnNo : int) %>
<TypekeyScheduledItemPropertyPattern
  codeIdentifier="${prop.CodeIdentifier}"
  column="${ScheduleDataTypeHelper.FIELD_TYPE_SCHED_COL_NAMES.get(APDFieldType.TC_TYPEKEY)}${columnNo}"
  identity="false"
  priority="${prop.Sequence}"
  propertyName="${prop.Name}"
  public-id="${prop.ScheduledItemPropertyPublicId}"
  typelist="${prop.TypelistToUse}"
  required="false"/>