<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(productLine:APDProductLine, fieldMax : int) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <LocationGroup
    id="${productLine.CodeIdentifier}Links"
    parent="PolicyFile(policyPeriod, asOfDate)"
    title="DisplayKey.get(&quot;Web.PolicyFile.Line.${productLine.LinePrefix}.${productLine.CodeIdentifier}&quot;)">
    <LocationEntryPoint
      signature="${productLine.CodeIdentifier}Links(policyPeriod : PolicyPeriod, asOfDate : java.util.Date)"/>
    <Variable
      name="policyPeriod"
      type="PolicyPeriod"/>
    <Variable
      initialValue="policyPeriod.EditEffectiveDate"
      name="asOfDate"
      type="java.util.Date"/>
<%if(productLine.Fields.Count > 0 or productLine.ChildCoverables.Count == 1 or productLine.Exposures.Count > 0 or productLine.Clauses.Count > 0) {%>
    <LocationRef
      location="PolicyFile_${productLine.LinePrefix.concat(productLine.TypeName)}(policyPeriod, asOfDate)"/>
<%}%>
<%if(productLine.Fields.Count > fieldMax or productLine.Fields.Count == 0 or productLine.ChildCoverables.Count > 1 or productLine.Exposures.Count > 0)  // too many line level fields to combine line and children
  for(child in productLine.ChildCoverables.sort(TemplateComparators.CoverableOrdering) index i) {%>
    <LocationRef
      location="PolicyFile_${child.LinePrefix.concat(child.TypeName)}(policyPeriod, asOfDate)"/>
<%}%>
 </LocationGroup>
</PCF>