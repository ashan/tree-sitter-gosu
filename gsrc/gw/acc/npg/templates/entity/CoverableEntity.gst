<% uses gw.acc.npg.model.Coverable %>
<% uses gw.acc.npg.model.ProductLine %>
<%@ params(coverable:Coverable) %>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${coverable.EntityName}"
  type="effdated"
  desc="${coverable.Description}"
  displayName="${coverable.EntityDisplayName}"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  extendable="true"
  platform="false"
  loadable="false"
  table="${coverable.TableName}">
  <implementsEntity
    name="Coverable"/>
<% if(not coverable.IncludeModifier){%>
  <implementsInterface
    iface="gw.api.domain.CoverableAdapter"
    impl="${coverable.LOBPackageName}.${coverable.CoverableAdapterImplName}"/>
<%} else {%>
  <implementsInterface
    iface="gw.api.domain.CoverableAdapter"
    impl="${coverable.LOBPackageName}.${coverable.CoverableModifiableAdapterImplName}"/>
  <implementsEntity
    name="Modifiable"/>
  <implementsInterface
    iface="gw.api.domain.ModifiableAdapter"
    impl="${coverable.LOBPackageName}.${coverable.CoverableModifiableAdapterImplName}"/>
<%}%>
${EntityColumn.renderToString(coverable.ReferredFromField)}
${EntityColumn.renderToString(coverable.CoverageArrayField)}
<%if(coverable.AttachToBuilding){%>
${EntityColumn.renderToString(coverable.BuildingsFkField)}
<%}%>
<%if(coverable.AttachToLocation){%>
${EntityColumn.renderToString(coverable.LocationFkField)}
<%}%>
<%if(coverable.IncludeExclusion){%>
${EntityColumn.renderToString(coverable.ExclusionsArrayField)}
<%}%>
<%if(coverable.IncludeCondition){%>
${EntityColumn.renderToString(coverable.ConditionsArrayField)}
<%}%>
<%if(coverable.IncludeModifier){%>
${EntityColumn.renderToString(coverable.ModifiersArrayField)}
<%}%>
<%for(var cost in coverable.Costs){%>
${EntityColumn.renderToString(cost.asReferenceArrayField())}
<%}%>
<%for(var cbl in coverable.Coverables){%>
${EntityColumn.renderToString(cbl.asReferenceArrayField())}
<%}%>
<%for(var field in coverable.AdditionalFields){%>
${EntityColumn.renderToString(field)}
<%}%>
  <column
    name="ReferenceDateInternal"
    type="datetime"
    nullok="true"
    desc="Internal field for storing the reference date of this entity on bound policy periods."/>
</entity>
