<%
uses entity.APDCoverable
uses gw.apd.model.generate.APDGosuReferencesHelper
uses gw.apd.model.generate.RiskEntityUIPageGenerationHelper
uses gw.apd.model.generate.templates.TemplateComparators

uses java.math.RoundingMode
%>
<%@params(coverable : APDCoverable, fieldMax : int)%>
<%
var inputColumnForCovsCreated = false

var coverableVarName = coverable.TypeName.uncapitalize()

var addExposureList = RiskEntityUIPageGenerationHelper.showExposureListOnPanelSet(coverable, fieldMax)
var addCoverableList = RiskEntityUIPageGenerationHelper.showCoverableListOnPanelSet(coverable, fieldMax)

var childTypeName = ""
var childArrayPropertyName = ""
var childArrayHasIdentifiers = false
if (addExposureList) {
  childTypeName = coverable.LinePrefix + coverable.Exposures.orderBy(\e -> e.Name).first().TypeName
  childArrayPropertyName = childTypeName + "s"
}
else if (addCoverableList) {
  var childCoverable = coverable.ChildCoverables.orderBy(\cc -> cc.Name).first()
  childTypeName = coverable.LinePrefix + childCoverable.TypeName
  childArrayPropertyName = childTypeName + "s"
  childArrayHasIdentifiers = childCoverable.Identifiers.HasElements
}
%>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <PanelSet
    id="${coverable.QualifiedName}PanelSet">
    <Require
      name="${coverableVarName}"
      type="entity.${coverable.QualifiedName}"/>
    <Require
      name="openForEdit"
      type="boolean"/>
    <Require
      name="jobWizardHelper"
      type="gw.api.web.job.JobWizardHelper"/>
<%for (category in coverable.ItemisedCoverageCategories.sort(TemplateComparators.ClauseCategoryOrdering)){%>
    <Variable
      initialValue="${coverableVarName}${APDGosuReferencesHelper.getReferenceToLine(coverable)}.Pattern.getCoverageCategoryByCodeIdentifier(&quot;${coverable.LinePrefix+category.CodeIdentifier}&quot;)"
      name="${category.CodeIdentifier.uncapitalize()}"
      type="gw.api.productmodel.CoverageCategory"/>
<%if (coverable.Coverages.HasElements) {%>
    <Variable
      initialValue="${category.CodeIdentifier.uncapitalize()}.coveragePatternsForEntity(entity.${coverable.QualifiedName}).whereSelectedOrAvailable(${coverableVarName}, openForEdit)"
      name="${category.CodeIdentifier.uncapitalize()}CovPatterns"
      recalculateOnRefresh="true"
      type="gw.api.productmodel.CoveragePattern[]"/>
<%}%>
<%}%>
    <CardViewPanel
      hideTabIfSingle="true">
      <Card
        id="details"
        title="DisplayKey.get(&quot;Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix.concat(coverable.TypeName)}.Details&quot;)">
<%if (coverable.Fields.Count > 0) {
var col1Count = (coverable.Fields.Count / 2bd).setScale(0, RoundingMode.UP)
// case where there are details on the left and list of coverages on the right
if (coverable.Exposures.Count == 0 and coverable.ChildCoverables.Count == 0 and coverable.ItemisedCoverageCategories.Count > 0 and coverable.Fields.Count <= fieldMax) col1Count = fieldMax%>
        <DetailViewPanel>
          <InputColumn>
<%for (field in coverable.Fields.sort(TemplateComparators.AttributeOrdering) index i) {
var displaykey = "Web.Policy.${coverable.LinePrefix}.${coverable.QualifiedName}.${field.Name}"
var openForEdit = (coverable.HasSplittableFields and !field.SplitByRatingPeriods) ? "${coverableVarName} == ${coverableVarName}.VersionList.AllVersions.first()" : "true"
var requiredString = (coverable.Identifiers.HasElements and coverable.Identifiers[0] == field) ? "true" : "false"
var renderedInputTemplate = Input.renderToString(coverableVarName, field, displaykey, openForEdit, null, requiredString, coverable.IsACoverable, childArrayPropertyName, childArrayHasIdentifiers)
if (col1Count == i) {%>
          </InputColumn>
          <InputColumn>
<%}%>${renderedInputTemplate}<%}%>
          </InputColumn>
<%if (coverable.Exposures.Count == 0 and coverable.ChildCoverables.Count != 1 and coverable.ItemisedCoverageCategories.Count > 0 and coverable.Fields.Count <= fieldMax and coverable.Coverages.HasElements) { // add coverages%>
          <InputColumn>
            <InputSetRef
              def="CoverageCategoryInputSet(${coverable.ItemisedCoverageCategories.orderBy(\c -> c.Sequence).first().CodeIdentifier.uncapitalize()}CovPatterns, ${coverableVarName}, openForEdit, jobWizardHelper)"
              id="${coverable.ItemisedCoverageCategories.orderBy(\c -> c.Sequence).first().CodeIdentifier}CovPatterns"/>
          </InputColumn>
<%inputColumnForCovsCreated = true}%>
        </DetailViewPanel>
<%}%>
<%if (addExposureList) { // add exposure list if there are not too many fields%>
        <PanelRef
          def="${childTypeName}ListPanelSet(${coverableVarName}, jobWizardHelper)"/>
<%} else if (addCoverableList) { // add coverable list if there are not too many fields or coverables%>
        <PanelRef
          def="${childTypeName}ListPanelSet(${coverableVarName}, openForEdit, jobWizardHelper)"/>
<%} else if(coverable.Fields.Count == 0 and coverable.ItemisedCoverageCategories.Count > 0 and coverable.Coverages.HasElements) { // coverages, no fields%>
        <DetailViewPanel>
          <InputColumn>
            <InputSetRef
              def="CoverageCategoryInputSet(${coverable.ItemisedCoverageCategories.orderBy(\c -> c.Sequence).first().CodeIdentifier.uncapitalize()}CovPatterns, ${coverableVarName}, openForEdit, jobWizardHelper)"
              id="${coverable.ItemisedCoverageCategories.orderBy(\c -> c.Sequence).first().CodeIdentifier}CovPatterns"/>
          </InputColumn>
        </DetailViewPanel>
<%inputColumnForCovsCreated = true}%>
      </Card>
<%for (category in coverable.ItemisedCoverageCategories.sort(TemplateComparators.ClauseCategoryOrdering) index i) {
     if ((i > 0 or coverable.Exposures.Count > 0 or coverable.ChildCoverables.Count > 0 or coverable.Fields.Count > fieldMax) and coverable.Coverages.HasElements and not inputColumnForCovsCreated) {%>
      <Card
        id="${category.CodeIdentifier}"
        title="DisplayKey.get(&quot;Web.Policy.${coverable.LinePrefix}.${coverable.QualifiedName}.${coverable.LinePrefix+category.CodeIdentifier}&quot;)">
        <DetailViewPanel>
          <InputColumn>
            <InputSetRef
              def="CoverageCategoryInputSet(${category.CodeIdentifier.uncapitalize()}CovPatterns, ${coverableVarName}, openForEdit, jobWizardHelper)"
              id="${category.CodeIdentifier}CovPatterns"/>
          </InputColumn>
        </DetailViewPanel>
       </Card>
<%}
    if (i == 0) {
      inputColumnForCovsCreated = false
    }  // for index 0, reset value so subsequent categories can get cards created
}%>
<%if (coverable.CoverageLibraryCategories.Count > 0) { %>
       <Card
         id="AdditionalCoverages"
         title="DisplayKey.get(&quot;Web.LineWizard.AdditionalCoverages&quot;)">
         <PanelRef
           def="AdditionalCoveragesPanelSet(${coverableVarName}, new String[]{${coverable.CoverageLibraryCategoriesXMLString }}, true, jobWizardHelper)"/>
       </Card>
<%}%>
<%if (coverable.ConditionAndExclusionLibraryCategories.Count > 0) { %>
       <Card
         id="ExclusionsAndconditions"
         title="DisplayKey.get(&quot;Web.LineWizard.ExclusionsAndConditions&quot;)">
         <PanelRef
           def="AdditionalExclusionsAndConditionsPanelSet(${coverableVarName}, new String[]{${coverable.ConditionAndExclusionLibraryCategoriesXMLString }}, true, jobWizardHelper)"/>
       </Card>
<%}%>
<%for (exposure in coverable.Exposures.sort(TemplateComparators.ExposureOrdering) index i)
     if (i > 0 or coverable.Fields.Count > fieldMax) {
       var onSelectAttribute = RiskEntityUIPageGenerationHelper.generateExposureSync(exposure, "${coverableVarName}")
%>
      <Card
        id="${exposure.TypeName}"
        onSelect="${onSelectAttribute}"
        title="DisplayKey.get(&quot;Web.Policy.${coverable.LinePrefix}.${coverable.QualifiedName}.${exposure.QualifiedName}&quot;)">
        <PanelRef
          def="${exposure.QualifiedName}ListPanelSet(${coverableVarName}, jobWizardHelper)"/>
       </Card>
<%}%>
<%if (not (coverable typeis APDProductLine))
for (child in coverable.ChildCoverables.sort(TemplateComparators.CoverableOrdering) index i)
     if (i > 0 or coverable.Exposures.Count > 0 or coverable.Fields.Count > fieldMax) {
       var onSelectAttribute = RiskEntityUIPageGenerationHelper.generateCoverableSync(child, "${child.Parent.TypeName.uncapitalize()}")
%>
      <Card
        id="${child.TypeName}"
<%if (onSelectAttribute.HasContent) {%>
        onSelect="${onSelectAttribute}"
<%}%>
        title="DisplayKey.get(&quot;Web.Policy.${coverable.LinePrefix}.${coverable.QualifiedName}.${child.QualifiedName}&quot;)">
        <PanelRef
          def="${child.QualifiedName}ListPanelSet(${coverableVarName}, openForEdit, jobWizardHelper)"/>
       </Card>
<%}%>
    </CardViewPanel>
  </PanelSet>
</PCF>