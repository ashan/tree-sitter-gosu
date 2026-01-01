<%
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(coverable:APDCoverable) %>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${coverable.LinePrefix}${coverable.TypeName}"
  type="effdated"
  desc="${StringEscapeUtils.escapeXml(coverable.Description)}"
  displayName="${StringEscapeUtils.escapeXml(coverable.Name)}"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  extendable="true"
  platform="false"
  loadable="false"
  table="${(coverable.LinePrefix + coverable.TypeName).toLowerCase()}">
<% if(coverable.HasSplittableFields){%>
  <implementsInterface
    iface="gw.lob.apd.APDSplittableRisk"
    impl="${coverable.LOBPackageName}.${coverable.QualifiedName}Splittable"/>
<%}%>
  <implementsInterface
    iface="gw.api.domain.rules.SyncableAdapter"
    impl="${coverable.LOBPackageName}.${coverable.QualifiedName}SyncableAdapter"/>
  <foreignkey
    desc="Parent: ${StringEscapeUtils.escapeXml(coverable.Parent.Name)}"
    fkentity="${coverable.LinePrefix}${coverable.Parent.TypeName}"
    name="${coverable.Parent.TypeName}"
    nullok="false"/>
<% if(coverable.AutoNumber){%>
  <column
    name="SequenceNumber"
    type="integer"
	nullok="false"
    desc="The number of this object to explicitly identify it on the policy"/>
<%}%>
<% if(coverable.RiskLocation == APDRiskLocationType.TC_ISLOCATION){%>
  <foreignkey
    name="Location"
    fkentity="PolicyLocation"
    desc="The location that this coverable wraps"
    columnName="LocationID"
    exportable="true"
    nullok="false"/>
<%}%>
<% if(coverable.RiskLocation == APDRiskLocationType.TC_ISBUILDING){%>
  <foreignkey
    name="Building"
    fkentity="Building"
    desc="The building that this coverable wraps"
    columnName="BuildingID"
    exportable="true"
    nullok="false"/>
<%}%>
${CoverableDelegate.renderToString(coverable)}
</entity>
