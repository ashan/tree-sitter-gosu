<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <DetailViewPanel
    id="${productLine.LineStandardCoveragesDVName}">
    <Require
      name="line"
      type="${productLine.EntityName}"/>
    <Require
      name="openForEdit"
      type="boolean"/>
    <Variable
      initialValue="line.Pattern.getCoverageCategoryByPublicId(&quot;${productLine.StndGroupName}&quot;)"
      name="covCat"
      type="gw.api.productmodel.CoverageCategory"/>
    <Variable
      initialValue="covCat.coveragePatternsForEntity(${productLine.EntityName}).whereSelectedOrAvailable(line, openForEdit)"
      name="covPatterns"
      recalculateOnRefresh="true"
      type="gw.api.productmodel.ClausePattern[]"/>
    <InputColumn>
      <InputIterator
        elementName="coveragePattern"
        forceRefreshDespiteChangedEntries="true"
        id="covIterator"
        value="covPatterns"
        valueType="gw.api.productmodel.ClausePattern[]">
        <IteratorSort
          sortBy="coveragePattern.Priority"
          sortOrder="1"/>
        <InputSetRef
          def="CoverageInputSet(coveragePattern, line, openForEdit)"
          mode="coveragePattern.PublicID"/>
      </InputIterator>
    </InputColumn>
  </DetailViewPanel>
</PCF>