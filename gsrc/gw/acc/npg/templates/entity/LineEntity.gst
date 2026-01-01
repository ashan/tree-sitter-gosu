<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine:ProductLine) %>
<subtype
  xmlns="http://guidewire.com/datamodel"
  entity="${productLine.EntityName}"
  desc="${productLine.EntityDisplayName} line of business"
  displayName="${productLine.EntityDisplayName}"
  supertype="PolicyLine">
  <implementsInterface
    iface="gw.api.policy.PolicyLineMethods"
    impl="${productLine.LOBPackageName}.${productLine.PolicyLineMethodsImplName}"/>
  <implementsEntity
    name="Coverable"/>
<% if(not productLine.IncludeModifier){%>
  <implementsInterface
    iface="gw.api.domain.CoverableAdapter"
    impl="${productLine.LOBPackageName}.${productLine.CoverableAdapterImplName}"/>
<%} else {%>
  <implementsInterface
    iface="gw.api.domain.CoverableAdapter"
    impl="${productLine.LOBPackageName}.${productLine.CoverableModifiableAdapterImplName}"/>
  <implementsEntity
    name="Modifiable"/>
  <implementsInterface
    iface="gw.api.domain.ModifiableAdapter"
    impl="${productLine.LOBPackageName}.${productLine.CoverableModifiableAdapterImplName}"/>
<%}%>
  <column
    name="ReferenceDateInternal"
    type="datetime"
	nullok="true"
    desc="Internal field for storing the reference date of this entity on bound policy periods."/>
  <array
    name="${productLine.LineCostArrayColumnName}"
    arrayentity="${productLine.LineCostArrayEntityName}"
    cascadeDelete="true"/>
${EntityColumn.renderToString(productLine.CoverageArrayField)}
<% if(productLine.IncludeCondition){%>
${EntityColumn.renderToString(productLine.ConditionsArrayField)}
<%}%>
<% if(productLine.IncludeExclusion){%>
${EntityColumn.renderToString(productLine.ExclusionsArrayField)}
<%}%>
<% if(productLine.IncludeModifier){%>
${EntityColumn.renderToString(productLine.ModifiersArrayField)}
<%}%>
<%for(var coverable in productLine.Coverables){%>
${EntityColumn.renderToString(coverable.asReferenceArrayField())}
<%if(coverable.IsAutoNumbered){%>
${EntityColumn.renderToString(coverable.asAutoNumberFkField())}
<%}%>
<%}%>
<%for(var cost in productLine.Costs){%>
${EntityColumn.renderToString(cost.asReferenceArrayField())}
<%}%>
<%for(var field in productLine.AdditionalFields){%>
${EntityColumn.renderToString(field)}
<%}%>
</subtype>