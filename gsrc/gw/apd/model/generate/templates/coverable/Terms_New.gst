<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(terms: APDTerm[]) %>
<%
terms = terms.copy()
terms.sort(TemplateComparators.AttributeOrdering)
%>
<CovTerms>
<% for (term in terms.where(\t -> t.Type == APDFieldType.TC_BOOLEAN) index i) {%>
${Term_New.renderToString(term, i+1)}
<%}%>
<% for (term in terms.where(\t -> t.Type == APDFieldType.TC_MONEY
                                        or t.Type == APDFieldType.TC_BIGDECIMAL
                                        or t.Type == APDFieldType.TC_INTEGER) index i) {%>
${Term_New.renderToString(term, i+1)}
<%}%>
<% for (term in terms.where(\t -> t.Type == APDFieldType.TC_DATE) index i) {%>
${Term_New.renderToString(term, i+1)}
<%}%>
<% for (term in terms.where(\t -> t.Type == APDFieldType.TC_VARCHAR) index i) {%>
${Term_New.renderToString(term, i+1)}
<%}%>
<% for (term in terms.where(\t -> t.Type == APDFieldType.TC_TYPEKEY) index i) {%>
${Term_New.renderToString(term, i+1)}
<%}%>
  </CovTerms>