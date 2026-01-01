<% uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.util.APDStringUtil
uses gw.apd.model.generate.xsd.productmodel.Product
uses org.apache.commons.lang.StringEscapeUtils %>
<%@ params(product: APDProduct, pmProduct : Product) %>
<?xml version="1.0"?>
<Product
<%
var productAttributes = new LinkedHashMap<String, String>()
productAttributes.put("abbreviation", product.Abbreviation)
productAttributes.put("apdManaged", "true")
productAttributes.put("codeIdentifier", product.CodeIdentifier)
if (pmProduct.DaysUntilQuoteNeeded != null) productAttributes.put("daysUntilQuoteNeeded", pmProduct.DaysUntilQuoteNeeded.toString())
productAttributes.put("defaultTermType", pmProduct.DefaultTermType)
productAttributes.put("priority", pmProduct.Priority.toString())
productAttributes.put("productAccountType", product.ProductAccountType.toString())
productAttributes.put("productType", pmProduct.ProductType)
productAttributes.put("public-id", product.CodeIdentifier)
if (pmProduct.QuoteRoundingLevel != null) productAttributes.put("quoteRoundingLevel", pmProduct.QuoteRoundingLevel.toString())
if (pmProduct.QuoteRoundingMode != null) productAttributes.put("quoteRoundingMode", pmProduct.QuoteRoundingMode.toString())
if (pmProduct.RefCode != null) productAttributes.put("refCode", pmProduct.RefCode.toString())

var iterator = productAttributes.entrySet().iterator()
while (iterator.hasNext()) {
    var entry = iterator.next()
%>
  ${entry.Key}="${entry.Value}"<%if (!iterator.hasNext()){%>><%}%>
<%}%>
  <AvailablePolicyTerms>
<%for(term in pmProduct.AvailablePolicyTerms.AvailablePolicyTerm.orderBy(\t -> t.CodeIdentifier)){%>
    <AvailablePolicyTerm
      codeIdentifier="${term.CodeIdentifier}"
      public-id="${term.PublicId}"
      termType="${term.TermType}"/>
<%}%>
  </AvailablePolicyTerms>
  <DocTemplateRefs>
<%for(doc in pmProduct.DocTemplateRefs.DocTemplateRef){%>
    <DocTemplateRef
      codeIdentifier="${doc.CodeIdentifier}"
      documentTemplateType="${doc.DocumentTemplateType}"
      public-id="${doc.PublicId}"
      templateFile="${doc.TemplateFile}"/>
<%}%>
  </DocTemplateRefs>
<%if(pmProduct.InitializeScript != null){%>
  <InitializeScript>${APDStringUtil.makeScriptXmlCdataString(pmProduct.InitializeScript)}</InitializeScript>
<%}%>
<%if(pmProduct.ProductModifierPatterns.ProductModifierPattern != null){%>
  <ProductModifierPatterns>
<%for (mp in pmProduct.ProductModifierPatterns.ProductModifierPattern) {%>
<%if (mp.ModifierDataType=="rate") {%>
    <ProductModifierPattern
<%
var productModifierAttributes = new LinkedHashMap<String, String>()
productModifierAttributes.put("codeIdentifier", mp.CodeIdentifier)
if (mp.DefaultMaximum != null) productModifierAttributes.put("defaultMaximum", mp.DefaultMaximum.toString())
if (mp.DefaultMinimum != null) productModifierAttributes.put("defaultMinimum", mp.DefaultMinimum.toString())
if (mp.DisplayEligibility != null) productModifierAttributes.put("displayEligibility", mp.DisplayEligibility.toString())
if (mp.DisplayJustification != null) productModifierAttributes.put("displayJustification", mp.DisplayJustification.toString())
if (mp.DisplayRange != null) productModifierAttributes.put("displayRange", mp.DisplayRange.toString())
if (mp.DisplayValueFinal != null) productModifierAttributes.put("displayValueFinal", mp.DisplayValueFinal.toString())
productModifierAttributes.put("lookupTableName", mp.LookupTableName)
productModifierAttributes.put("modifierDataType", mp.ModifierDataType)
productModifierAttributes.put("modifierSubtype", mp.ModifierSubtype)
productModifierAttributes.put("priority", mp.Priority.toString())
productModifierAttributes.put("public-id", mp.PublicId)
if (mp.RefCode != null) productModifierAttributes.put("refCode", mp.RefCode)
if (mp.RenderRateAsMultiplier != null) productModifierAttributes.put("renderRateAsMultiplier", mp.RenderRateAsMultiplier.toString())
if (mp.ScheduleRate != null) productModifierAttributes.put("scheduleRate", mp.ScheduleRate)

iterator = productModifierAttributes.entrySet().iterator()
while (iterator.hasNext()) {
    var entry = iterator.next()
%>
      ${entry.Key}="${entry.Value}"<%if (!iterator.hasNext()){%>><%}%>
<%}%>
<%if (mp.AvailabilityScript != null) {%>
      <AvailabilityScript>${APDStringUtil.makeScriptXmlCdataString(mp.AvailabilityScript)}</AvailabilityScript>
<%}%>
<%if (mp.ScheduleRate == "true") { // this is stored a string, not boolean%>
      <ProductRateFactorPatterns>
<%for (rfp in mp.ProductRateFactorPatterns.ProductRateFactorPattern) {%>
        <ProductRateFactorPattern
<%
var productRateFactorAttributes = new LinkedHashMap<String, String>()
productRateFactorAttributes.put("codeIdentifier", rfp.CodeIdentifier)
if (rfp.DefaultMaximum != null) productRateFactorAttributes.put("defaultMaximum", rfp.DefaultMaximum.toString())
if (rfp.DefaultMinimum != null) productRateFactorAttributes.put("defaultMinimum", rfp.DefaultMinimum.toString())
productRateFactorAttributes.put("lookupTableName", rfp.LookupTableName)
productRateFactorAttributes.put("priority", rfp.Priority.toString())
productRateFactorAttributes.put("public-id", rfp.PublicId)
productRateFactorAttributes.put("rateFactorType", rfp.RateFactorType)
if (rfp.RefCode != null) productRateFactorAttributes.put("refCode", rfp.RefCode)

iterator = productRateFactorAttributes.entrySet().iterator()
while (iterator.hasNext()) {
    var entry = iterator.next()
%>
          ${entry.Key}="${entry.Value}"<%if (!iterator.hasNext()){%>><%}%>
<%}%>
<%if (rfp.AvailabilityScript != null) {%>
          <AvailabilityScript>${APDStringUtil.makeScriptXmlCdataString(rfp.AvailabilityScript)}</AvailabilityScript>
<%}%>
        </ProductRateFactorPattern>
<%}%>
      </ProductRateFactorPatterns>
<%} else {%>
      <ProductRateFactorPatterns/>
<%}%>
    </ProductModifierPattern>
<%} else {%>
    <ProductModifierPattern
<%
var productModifierAttributes = new LinkedHashMap<String, String>()
productModifierAttributes.put("codeIdentifier", mp.CodeIdentifier)
if (mp.DisplayJustification != null) productModifierAttributes.put("displayJustification", mp.DisplayJustification.toString())
productModifierAttributes.put("lookupTableName", mp.LookupTableName)
productModifierAttributes.put("modifierDataType", mp.ModifierDataType)
productModifierAttributes.put("modifierSubtype", mp.ModifierSubtype)
productModifierAttributes.put("priority", mp.Priority.toString())
productModifierAttributes.put("public-id", mp.PublicId)
if (mp.RefCode != null) productModifierAttributes.put("refCode", mp.RefCode)
if (mp.TypeList != null) productModifierAttributes.put("typeList", mp.TypeList)

iterator = productModifierAttributes.entrySet().iterator()
while (iterator.hasNext()) {
    var entry = iterator.next()
%>
      ${entry.Key}="${entry.Value}"<%if (!iterator.hasNext()){%>><%}%>
<%}%>
<%if (mp.AvailabilityScript != null) {%>
      <AvailabilityScript>${APDStringUtil.makeScriptXmlCdataString(mp.AvailabilityScript)}</AvailabilityScript>
<%}%>
      <ProductRateFactorPatterns/>
    </ProductModifierPattern>
<%}
}%>
  </ProductModifierPatterns>
<%}%>
  <ProductPolicyLinePatterns>
<%for (line in product.ProductLines*.ProductLine.sort(TemplateComparators.CoverableOrdering)) {%>
    <ProductPolicyLinePattern
<%var linePatternID : String
var matchingPM = pmProduct.ProductPolicyLinePatterns.ProductPolicyLinePattern.firstWhere(\plp -> plp.PolicyLinePattern == line.CodeIdentifier)
if (matchingPM != null) linePatternID = matchingPM.PublicId
else linePatternID = APDStringUtil.makeCodeIdentifier(line.CodeIdentifier)%>
      codeIdentifier="${linePatternID}"
      policyLinePattern="${line.CodeIdentifier}"
      public-id="${linePatternID}"/>
<%}%>
  </ProductPolicyLinePatterns>
  <ProductQuestionSetPatterns>
<%for(q in pmProduct.ProductQuestionSetPatterns.ProductQuestionSetPattern){%>
    <ProductQuestionSetPattern
      codeIdentifier="${q.CodeIdentifier}"
      public-id="${q.PublicId}"
      questionSet="${q.QuestionSet}"/>
<%}%>
  </ProductQuestionSetPatterns>
</Product>
