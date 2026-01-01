<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
<!-- ======================================================================================= -->
<!-- ${productLine.LineDisplayName} Lookup Tables -->
<!-- ======================================================================================= -->
${CoverableLookup.renderToString(productLine)}

<%for(var coverable in productLine.Coverables){%>
${CoverableLookup.renderToString(coverable)}
<%}%>
