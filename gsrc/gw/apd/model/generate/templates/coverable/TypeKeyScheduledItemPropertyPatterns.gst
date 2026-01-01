<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(schedCov : APDClause) %>
<%for (prop in schedCov.ScheduleItemProperties.where(\f -> f.Type == APDFieldType.TC_TYPEKEY).sort(TemplateComparators.AttributeOrdering) index i) {%>
${TypeKeyScheduledItemPropertyPattern.renderToString(prop, i+1)}
<%}%>
