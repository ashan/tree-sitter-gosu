<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
<?xml version="1.0"?>
<PCF
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="../../../../../../../pcf.xsd">
  <PanelSet
    id="${productLine.RatingOverridePanelSetName}"
    mode="${productLine.LineCode}">
    <Require
      name="period"
      type="PolicyPeriod"/>
    <Variable
      initialValue="period.${productLine.LineCode}"
      name="line"
      type="${productLine.EntityName}"/>
    <Variable
      initialValue="new ${productLine.LOBPackageName}.financials.${productLine.QuoteDisplayUtilName}(line, true)"
      name="quoteDisplayUtil"
      type="${productLine.LOBPackageName}.financials.${productLine.QuoteDisplayUtilName}"/>
    <Variable
      initialValue="quoteDisplayUtil.getCoverablesWithCostsByType()"
      name="cblByType"
      type="Map&lt;gw.lang.reflect.IType, List&lt;Coverable&gt;&gt;"/>
    <Variable
      initialValue="quoteDisplayUtil.getCostsByCoverable()"
      name="costsByCbl"
      type="Map&lt;Coverable, List&lt;${productLine.BaseCost.EntityName}&gt;&gt;"/>
    <Variable
      initialValue="costsByCbl.get(line)"
      name="lineLevelCosts"
      type="List&lt;${productLine.BaseCost.EntityName}&gt;"/>
    <Variable
      initialValue="CurrentLocation.InEditMode"
      name="isEditable"
      type="boolean"/>
    <Variable
      initialValue="period.EditEffectiveDate"
      name="jobEffDate"
      type="Date"/>
    <Variable
      initialValue="period.PreferredSettlementCurrency"
      name="prefCurrency"
      type="Currency"/>
    <PanelIterator
      elementName="cblType"
      id="cblTypeIterator"
      value="cblByType.Keys.where( \ t -&gt; t != productmodel.${productLine.LineCode})"
      valueType="List&lt;gw.lang.reflect.IType&gt;">
      <IteratorSort
        sortBy="cblType.toString()"
        sortOrder="1"/>
      <PanelIterator
        elementName="cbl"
        id="cblIterator"
        value="cblByType.get(cblType).toTypedArray()"
        valueType="Coverable[]">
        <IteratorSort
          sortBy="cbl.FixedId"
          sortOrder="1"/>
        <DetailViewPanel>
          <InputColumn>
            <Label
              label="quoteDisplayUtil.CoverableDisplayName(cbl)"/>
          </InputColumn>
        </DetailViewPanel>
        <DetailViewPanel>
          <InputColumn>
            <ListViewInput
              def="${productLine.RatingOverrideCostLVName}(costsByCbl.get(cbl), quoteDisplayUtil, isEditable, jobEffDate, prefCurrency)">
	      <Toolbar/>
	    </ListViewInput>
          </InputColumn>
        </DetailViewPanel>
      </PanelIterator>
    </PanelIterator>
    <DetailViewPanel
      visible="lineLevelCosts.Count&gt;0">
      <InputColumn>
        <Label
          label="DisplayKey.get(&quot;Web.Policy.${productLine.Abbrevation}.Financials.LineLevelPremiums&quot;)"/>
      </InputColumn>
    </DetailViewPanel>
    <DetailViewPanel
      visible="lineLevelCosts.Count&gt;0">
      <InputColumn>
        <ListViewInput
          def="${productLine.RatingOverrideCostLVName}(lineLevelCosts, quoteDisplayUtil, isEditable, jobEffDate, prefCurrency)">
	  <Toolbar/>
        </ListViewInput>
      </InputColumn>
    </DetailViewPanel>
  </PanelSet>
</PCF>