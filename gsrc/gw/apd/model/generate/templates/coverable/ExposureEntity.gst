<%
uses gw.apd.model.generate.templates.TemplateComparators
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(exposure:APDExposure) %>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${exposure.Coverable.LinePrefix}${exposure.TypeName}"
  type="effdated"
  desc="${StringEscapeUtils.escapeXml(exposure.Description)}"
  displayName="${StringEscapeUtils.escapeXml(exposure.Name)}"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  extendable="true"
  platform="false"
  loadable="false"
  table="${(exposure.Coverable.LinePrefix + exposure.TypeName).toLowerCase()}">
<% if(exposure.HasSplittableFields){%>
  <implementsInterface
    iface="gw.lob.apd.APDSplittableRisk"
    impl="${exposure.Coverable.LOBPackageName}.${exposure.QualifiedName}Splittable"/>
<%}%>
  <implementsInterface
    iface="gw.api.domain.rules.SyncableAdapter"
    impl="${exposure.Coverable.LOBPackageName}.${exposure.QualifiedName}SyncableAdapter"/>
  <foreignkey
    desc="Coverable: ${StringEscapeUtils.escapeXml(exposure.Coverable.Name)}"
    fkentity="${exposure.Coverable.LinePrefix}${exposure.Coverable.TypeName}"
    name="${exposure.Coverable.TypeName}"
    nullok="false"/>
<% if(exposure.IsAutoNumbered){%>
  <column
    name="SequenceNumber"
    type="integer"
	nullok="false"
    desc="The number of this object to explicitly identify it on the policy"/>
<%}%>
<%for(var field in exposure.Fields.sort(TemplateComparators.AttributeOrdering)){%>
${Field.renderToString(field)}<%
%>${FieldAvailabilityColumn.renderToString(field)}
<%}%>
</entity>
