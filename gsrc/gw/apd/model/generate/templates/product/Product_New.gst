<% uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.util.APDStringUtil %>
<%@ params(product: APDProduct) %>
<?xml version="1.0"?>
<Product
  abbreviation="${product.Abbreviation}"
  apdManaged="true"
  codeIdentifier="${product.CodeIdentifier}"
  daysUntilQuoteNeeded="14"
  defaultTermType="Annual"
  priority="0"
  productAccountType="${product.ProductAccountType}"
  productType="Commercial"
  public-id="${product.CodeIdentifier}"
  quoteRoundingLevel="0"
  quoteRoundingMode="HALF_EVEN">
  <AvailablePolicyTerms>
<%
var termIDs : TreeMap<String, String> = {
    APDStringUtil.makeCodeIdentifier(product.CodeIdentifier + "Other") -> "Other",
    APDStringUtil.makeCodeIdentifier(product.CodeIdentifier + "Annual") -> "Annual"
}
for(termID in termIDs.entrySet()) {
%>
    <AvailablePolicyTerm
      codeIdentifier="${termID.Key}"
      public-id="${termID.Key}"
      termType="${termID.Value}"/>
<%}%>
  </AvailablePolicyTerms>
  <DocTemplateRefs>
  </DocTemplateRefs>
  <InitializeScript></InitializeScript>
  <ProductPolicyLinePatterns>
<%for (line in product.ProductLines*.ProductLine.sort(TemplateComparators.CoverableOrdering)) {%>
    <ProductPolicyLinePattern
<%var linePatternID = APDStringUtil.makeCodeIdentifier(line.CodeIdentifier)%>
      codeIdentifier="${linePatternID}"
      policyLinePattern="${line.CodeIdentifier}"
      public-id="${linePatternID}"/>
<%}%>
  </ProductPolicyLinePatterns>
  <ProductQuestionSetPatterns>
  </ProductQuestionSetPatterns>
</Product>
