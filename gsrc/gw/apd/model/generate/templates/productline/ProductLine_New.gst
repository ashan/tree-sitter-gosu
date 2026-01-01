<% uses gw.apd.model.generate.templates.TemplateComparators
uses gw.api.util.CurrencyUtil %>
<%@ params(productLine: APDProductLine) %>
<?xml version="1.0"?>
<PolicyLinePattern
  apdManaged="true"
  codeIdentifier="${productLine.CodeIdentifier}"
  policyLineSubtype="${productLine.LinePrefix}${productLine.TypeName}"
  priority="-1"
  public-id="${productLine.CodeIdentifier}"
  territoryCodeNeeded="false">
  <AvailableCoverageCurrencies>
<%if (productLine.Currencies == APDCurrencyHandling.TC_DOMESTIC){%>
<%var defaultCurrency = CurrencyUtil.getDefaultCurrency()%>
    <AvailableCoverageCurrency
      codeIdentifier="${productLine.CodeIdentifier}${defaultCurrency}"
      currency="${defaultCurrency.Code}"
      public-id="${productLine.getAvailableCoverageCurrencyPublicId(defaultCurrency)}"/>
<%} else {%>
<% for (ccy in Currency.AllTypeKeys.toTypedArray().sort(TemplateComparators.TypekeyOrdering)) {%>
    <AvailableCoverageCurrency
      codeIdentifier="${productLine.CodeIdentifier}${ccy.Code}"
      currency="${ccy.Code}"
      public-id="${productLine.getAvailableCoverageCurrencyPublicId(ccy)}"/>
<%}%>
<%}%>
  </AvailableCoverageCurrencies>
  <CoverageCategories>
<%for (category in productLine.AllClauseCategories.sort(TemplateComparators.ClauseCategoryOrdering)) {%>
    <CoverageCategory priority="-1" codeIdentifier="${productLine.LinePrefix}${category.CodeIdentifier}" public-id="${productLine.LinePrefix}${category.CodeIdentifier}"/>
<%}%>
  </CoverageCategories>
</PolicyLinePattern>