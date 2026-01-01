<%
uses gw.apd.model.generate.RiskEntityUIPageGenerationHelper
%>
<%@params(coverable : APDCoverable, fieldMax : int)%>
<%
var afterEnterSyncCoverable = gw.apd.model.generate.RiskEntityUIPageGenerationHelper
    .generateOnEnterAttribute(coverable, fieldMax, coverable.TypeName.uncapitalize())
var afterEnterAttribute = "if (${coverable.Parent.TypeName.uncapitalize()} != null) ${coverable.TypeName.uncapitalize()} = ${coverable.Parent.TypeName.uncapitalize()}.createAndAdd${coverable.LinePrefix+coverable.TypeName}() else { ${afterEnterSyncCoverable} }"
%>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <Popup
    afterEnter="${afterEnterAttribute}"
<%if (coverable.ContainsSplittableAttribute) {%>
    beforeCommit="${coverable.TypeName.uncapitalize()}.syncSplittableFields()"
<%}%>
    canEdit="canEdit"
    id="${coverable.LinePrefix+coverable.TypeName}Popup"
    startInEditMode="canEdit"
<%if (coverable.HasSplittableFields) {%>
    title="DisplayKey.get(&quot;Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix.concat(coverable.TypeName)}.SplitDetails&quot;, ${coverable.TypeName.uncapitalize()}.EffectiveDate.ShortFormat, ${coverable.TypeName.uncapitalize()}.ExpirationDate.ShortFormat)">
<%} else {%>
    title="DisplayKey.get(&quot;Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix.concat(coverable.TypeName)}.Details&quot;)">
<%}%>
    <LocationEntryPoint
      signature="${coverable.LinePrefix+coverable.TypeName}Popup(${coverable.TypeName.uncapitalize()} : entity.${coverable.LinePrefix+coverable.TypeName}, canEdit : boolean, jobWizardHelper : gw.api.web.job.JobWizardHelper)"/>
    <LocationEntryPoint
      signature="${coverable.LinePrefix+coverable.TypeName}Popup(${coverable.Parent.TypeName.uncapitalize()} : entity.${coverable.LinePrefix+coverable.Parent.TypeName}, canEdit : boolean, jobWizardHelper : gw.api.web.job.JobWizardHelper)"/>
    <Variable
      name="${coverable.TypeName.uncapitalize()}"
      type="entity.${coverable.LinePrefix+coverable.TypeName}"/>
    <Variable
      name="canEdit"
      type="boolean"/>
    <Variable
      name="${coverable.Parent.TypeName.uncapitalize()}"
      type="entity.${coverable.LinePrefix+coverable.Parent.TypeName}"/>
    <Variable
      name="jobWizardHelper"
      type="gw.api.web.job.JobWizardHelper"/>
    <Screen
      editable="true">
      <Toolbar>
        <EditButtons/>
      </Toolbar>
      <PanelRef
        def="${coverable.LinePrefix+coverable.TypeName}PanelSet(${coverable.TypeName.uncapitalize()}, canEdit, jobWizardHelper)"/>
    </Screen>
  </Popup>
</PCF>