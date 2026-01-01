<% uses gw.acc.npg.model.ProductLine %>
<% uses gw.api.util.CurrencyUtil %>
<%@ params(productLine: ProductLine) %>
<?xml version="1.0"?>
<PolicyLinePattern
  codeIdentifier="${productLine.LineCode}"
  policyLineSubtype="${productLine.EntityName}"
  priority="-1"
  public-id="${productLine.LineCode}"
  territoryCodeNeeded="false">
  <CoverageCategories>
    <CoverageCategory priority="-1" codeIdentifier="${productLine.StndGroupName}" public-id="${productLine.StndGroupName}"/>
    <CoverageCategory priority="-1" codeIdentifier="${productLine.AddGroupName}" public-id="${productLine.AddGroupName}"/>
<%if(productLine.IncludeExclusion){%>
    <CoverageCategory priority="-1" codeIdentifier="${productLine.ExclusionGroupName}" public-id="${productLine.ExclusionGroupName}"/>
<%}%>
<%if(productLine.IncludeCondition){%>
    <CoverageCategory priority="-1" codeIdentifier="${productLine.ConditionGroupName}" public-id="${productLine.ConditionGroupName}"/>
<%}%>
<%for(var coverable in productLine.Coverables){%>
    <CoverageCategory priority="-1" codeIdentifier="${coverable.AddGroupName}" public-id="${coverable.AddGroupName}"/>
    <CoverageCategory priority="-1" codeIdentifier="${coverable.StndGroupName}" public-id="${coverable.StndGroupName}"/>
<%if(coverable.IncludeExclusion){%>
    <CoverageCategory priority="-1" codeIdentifier="${coverable.ExclusionGroupName}" public-id="${coverable.ExclusionGroupName}"/>
<%}%>
<%if(coverable.IncludeCondition){%>
    <CoverageCategory priority="-1" codeIdentifier="${coverable.ConditionGroupName}" public-id="${coverable.ConditionGroupName}"/>
<%}%>
<%}%>
  </CoverageCategories>
  <ModifierPatterns/>
<%var defaultCurrency = CurrencyUtil.getDefaultCurrency()%>
<%var coverageCurrencyId = "${productLine.LineCode}${defaultCurrency}"%>
  <AvailableCoverageCurrencies>
    <AvailableCoverageCurrency
      codeIdentifier="${coverageCurrencyId}"
      currency="${defaultCurrency}"
      public-id="${coverageCurrencyId}"/>
  </AvailableCoverageCurrencies>
</PolicyLinePattern>