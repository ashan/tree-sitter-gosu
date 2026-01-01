<%
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(productLine: APDProductLine) %>
<?xml version="1.0"?>
<typelistextension xmlns="http://guidewire.com/typelists" name="PolicyLine">
  <typefilter
    desc="Policy lines that can be associated with a policy hold"
    name="PolicyHoldLines">
    <include
      code="${productLine.QualifiedName}"/>
  </typefilter>
</typelistextension>