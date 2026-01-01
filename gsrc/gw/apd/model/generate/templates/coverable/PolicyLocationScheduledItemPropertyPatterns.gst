<%
uses gw.apd.model.generate.ScheduleDataTypeHelper
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(schedCov : APDClause) %>
<%for (prop in schedCov.ScheduleItemProperties.where(\f -> f.Type == APDFieldType.TC_LOCATION).sort(TemplateComparators.AttributeOrdering) index i) {%>
${PolicyLocationScheduledItemPropertyPattern.renderToString(prop, i+1)}
<%}%>
