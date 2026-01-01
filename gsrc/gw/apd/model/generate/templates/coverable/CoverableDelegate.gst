<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable : APDCoverable) %>
<%
uses org.apache.commons.lang.StringEscapeUtils
%>
<% if(coverable.IsACoverable){%>
  <implementsEntity
    name="Coverable"/>
<% if(not coverable.HasModifiers){%>
  <implementsInterface
    iface="gw.api.domain.CoverableAdapter"
    impl="${coverable.LOBPackageName}.${coverable.QualifiedName}CoverableAdapter"/>
<%}%>
<%}%>
<% if(coverable.HasModifiers){%>
  <implementsEntity
    name="Modifiable"/>
<% if(coverable.IsACoverable){%>
  <implementsInterface
    iface="gw.api.domain.CoverableAdapter"
    impl="${coverable.LOBPackageName}.${coverable.QualifiedName}CoverableModifiableAdapter"/>
  <implementsInterface
    iface="gw.api.domain.ModifiableAdapter"
    impl="${coverable.LOBPackageName}.${coverable.QualifiedName}CoverableModifiableAdapter"/>
<%} else {%>
  <implementsInterface
    iface="gw.api.domain.ModifiableAdapter"
    impl="${coverable.LOBPackageName}.${coverable.QualifiedName}ModifiableAdapter"/>
<%}%>
<%}%>
<%for(var field in coverable.Fields.sort(TemplateComparators.AttributeOrdering)){%>
${Field.renderToString(field)}<%
%>${FieldAvailabilityColumn.renderToString(field)}
<%}%>
<% if(coverable.Coverages.Count > 0){%>
  <array
    name="${coverable.LinePrefix}Coverages"
    desc="${StringEscapeUtils.escapeXml(coverable.Name)} Coverages"
    arrayentity="${coverable.QualifiedName}Cov"
    cascadeDelete="true"/>
<%}%>
<% if(coverable.Conditions.Count > 0){%>
  <array
    name="${coverable.LinePrefix}Conditions"
    desc="${StringEscapeUtils.escapeXml(coverable.Name)} Conditions"
    arrayentity="${coverable.QualifiedName}Cond"
    cascadeDelete="true"/>
<%}%>
<% if(coverable.Exclusions.Count > 0){%>
  <array
    name="${coverable.LinePrefix}Exclusions"
    desc="${StringEscapeUtils.escapeXml(coverable.Name)} Exclusions"
    arrayentity="${coverable.QualifiedName}Excl"
    cascadeDelete="true"/>
<%}%>
<% if(coverable.HasModifiers){%>
  <array
    name="${coverable.LinePrefix}Modifiers"
    desc="${StringEscapeUtils.escapeXml(coverable.Name)} Modifiers"
    arrayentity="${coverable.QualifiedName}Mod"
    cascadeDelete="true"/>
<%}%>
<%for(var cbl in coverable.ChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
  <array
    name="${cbl.QualifiedName}s"
    desc="${StringEscapeUtils.escapeXml(cbl.Description)}"
    arrayentity="${cbl.QualifiedName}"
    cascadeDelete="true"/>
<%if(cbl.AutoNumber){%>
  <foreignkey
    desc="Sequence to autonumber ${StringEscapeUtils.escapeXml(cbl.Name)}"
    fkentity="AutoNumberSequence"
    name="${cbl.QualifiedName}AutoNumberSeq"
    nullok="true"/>
<%}%>
<%}  // end of child coverable%>
<%for(var exposure in coverable.Exposures.sort(TemplateComparators.ExposureOrdering)){%>
  <array
    name="${coverable.LinePrefix+exposure.TypeName}s"
    desc="${StringEscapeUtils.escapeXml(exposure.Description)}"
    arrayentity="${coverable.LinePrefix}${exposure.TypeName}"
    cascadeDelete="true"/>
<%if(exposure.IsAutoNumbered){%>
  <foreignkey
    desc="Sequence to autonumber ${StringEscapeUtils.escapeXml(exposure.Name)}"
    fkentity="AutoNumberSequence"
    name="${coverable.LinePrefix}${exposure.TypeName}AutoNumberSeq"
    nullok="true"/>
<%}%>
<%}%>
  <array
    name="${coverable.QualifiedName}Costs"
    desc="${StringEscapeUtils.escapeXml(coverable.Name)} Costs"
    arrayentity="${coverable.QualifiedName}Cost"
    cascadeDelete="true"/>
