<% uses gw.acc.npg.model.ProductLine %>
<% uses com.guidewire.pc.system.productmodel.impl.PublicIdGenerator %>
<%@ params(productLine: ProductLine) %>
<?xml version="1.0"?>
<Product
  abbreviation="${productLine.Abbrevation}"
  codeIdentifier="${productLine.ProductCode}"
  daysUntilQuoteNeeded="14"
  defaultTermType="Annual"
  priority="50"
  productAccountType="Any"
  productType="Personal"
  public-id="${productLine.ProductCode}"
  quoteRoundingLevel="0"
  quoteRoundingMode="HALF_UP">
  <AvailablePolicyTerms>
    <AvailablePolicyTerm
<%var otherTermID = PublicIdGenerator.instance().generateId()%>
      codeIdentifier="${otherTermID}"
      public-id="${otherTermID}"
      termType="Other"/>
    <AvailablePolicyTerm
<%var annualTermID = PublicIdGenerator.instance().generateId()%>
      codeIdentifier="${annualTermID}"
      public-id="${annualTermID}"
      termType="Annual"/>
  </AvailablePolicyTerms>
  <DocTemplateRefs/>
  <InitializeScript/>
  <ProductPolicyLinePatterns>
    <ProductPolicyLinePattern
<%var linePatternID = PublicIdGenerator.instance().generateId()%>
      codeIdentifier="${linePatternID}"
      policyLinePattern="${productLine.LineCode}"
      public-id="${linePatternID}"/>
  </ProductPolicyLinePatterns>
  <ProductQuestionSetPatterns/>
</Product>
