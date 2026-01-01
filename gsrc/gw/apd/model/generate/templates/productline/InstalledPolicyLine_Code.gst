<%
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(productLine: APDProductLine) %>
<?xml version="1.0"?>
<typelistextension
  xmlns="http://guidewire.com/typelists"
  name="InstalledPolicyLine">
    <typecode code="${productLine.LinePrefix}" desc="${StringEscapeUtils.escapeXml(productLine.Description)}" name="${productLine.CodeIdentifier}"/>
</typelistextension>