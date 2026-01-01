<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(schedCov : APDClause, type : APDFieldType) %>
<%for (prop in schedCov.ScheduleItemProperties.where(\f -> f.Type == type).sort(TemplateComparators.AttributeOrdering) index i) {%>
${ScheduledItemPropertyPattern.renderToString(prop, i+1)}
<%}%>
