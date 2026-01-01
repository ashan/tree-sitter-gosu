<%@ params(productLine: APDProductLine) %>
${productLine.LookupLineStartTag}
  <!-- ======================================================================================= -->
  <!-- ${productLine.Name} Lookup Tables -->
  <!-- ======================================================================================= -->

${productLine.LookupLineEndTag}
<% // needs new line to ensure insert tag gets onto its own line%>