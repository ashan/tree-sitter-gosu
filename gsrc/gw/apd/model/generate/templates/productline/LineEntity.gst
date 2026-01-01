<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.model.generate.templates.coverable.CoverableDelegate
uses org.apache.commons.lang.StringEscapeUtils

var extPackage = productLine.LOBPackageName
%>
<subtype
  xmlns="http://guidewire.com/datamodel"
  entity="${productLine.QualifiedName}"
  desc="${StringEscapeUtils.escapeXml(productLine.Description)}"
  displayName="${StringEscapeUtils.escapeXml(productLine.Name)}"
  supertype="PolicyLine">
  <implementsInterface
    iface="gw.api.policy.PolicyLineMethods"
    impl="${extPackage}.${productLine.LinePrefix}PolicyLineMethods"/>
<% if(productLine.HasSplittableFields){%>
  <implementsInterface
    iface="gw.lob.apd.APDSplittableRisk"
    impl="${extPackage}.${productLine.QualifiedName}Splittable"/>
<%}%>
  <implementsInterface
    iface="gw.api.domain.rules.SyncableAdapter"
    impl="${productLine.LOBPackageName}.${productLine.QualifiedName}SyncableAdapter"/>
  <array
    name="${productLine.LinePrefix}Costs"
    arrayentity="${productLine.LinePrefix}Cost"
    cascadeDelete="true"/>
${CoverableDelegate.renderToString(productLine)}
</subtype>