<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable: Coverable) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <DetailViewPanel
    id="${coverable.CoverableCoveragesDVName}">
    <Require
      name="item"
      type="${coverable.EntityName}"/>
    <Require
      name="openForEdit"
      type="boolean"/>
    <Variable
      initialValue="item != null ? item.PolicyLine.Pattern.getCoverageCategoryByPublicId(&quot;${coverable.StndGroupName}&quot;).coveragePatternsForEntity(${coverable.EntityName}).whereSelectedOrAvailable(item, openForEdit) : null"
      name="covPatterns"
      recalculateOnRefresh="true"
      type="gw.api.productmodel.ClausePattern[]"/>
    <InputColumn>
      <InputIterator
        elementName="coveragePattern"
        forceRefreshDespiteChangedEntries="true"
        id="CovCategoryIterator"
        value="covPatterns"
        valueType="gw.api.productmodel.ClausePattern[]">
        <IteratorSort
          sortBy="coveragePattern.Priority"
          sortOrder="1"/>
        <InputSetRef
          def="CoverageInputSet(coveragePattern, item, openForEdit)"
          mode="coveragePattern.PublicID"/>
      </InputIterator>
    </InputColumn>
  </DetailViewPanel>
</PCF>
