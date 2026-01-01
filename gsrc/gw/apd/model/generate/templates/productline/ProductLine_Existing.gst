<% uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.model.generate.xsd.productlinemodel.PolicyLinePattern
uses gw.apd.util.APDStringUtil
uses gw.api.util.CurrencyUtil
uses org.apache.commons.lang.StringEscapeUtils %>
<%@ params(productLine: APDProductLine, pmLineProduct : PolicyLinePattern) %>
<?xml version="1.0"?>
<PolicyLinePattern
  apdManaged="true"
  codeIdentifier="${productLine.CodeIdentifier}"
  policyLineSubtype="${productLine.LinePrefix}${productLine.TypeName}"
  priority="${pmLineProduct.Priority}"
  public-id="${productLine.CodeIdentifier}"
<%if(pmLineProduct.RefCode != null){%>
  refCode="${pmLineProduct.RefCode}"
<%}%>
  territoryCodeNeeded="${pmLineProduct.TerritoryCodeNeeded}">
  <AvailableCoverageCurrencies>
<%if (productLine.Currencies == APDCurrencyHandling.TC_DOMESTIC){%>
<%var defaultCurrency = CurrencyUtil.getDefaultCurrency()%>
    <AvailableCoverageCurrency
      codeIdentifier="${productLine.CodeIdentifier}${defaultCurrency.Code}"
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
<%for (category in productLine.AllClauseCategories.sort(TemplateComparators.ClauseCategoryOrdering)) {
var priority : String
var matchingPM = pmLineProduct.CoverageCategories.CoverageCategory.firstWhere(\cc -> cc.CodeIdentifier == productLine.LinePrefix + category.CodeIdentifier)
if (matchingPM != null) priority = matchingPM.Priority.toString()
else priority = "-1"
var addRefCode = ""
if (matchingPM != null && matchingPM.RefCode != null) addRefCode = " refCode=\"${matchingPM.RefCode}\""%>
    <CoverageCategory priority="${priority}" codeIdentifier="${productLine.LinePrefix}${category.CodeIdentifier}" public-id="${productLine.LinePrefix}${category.CodeIdentifier}"${addRefCode}/>
<%}%>
  </CoverageCategories>
<%if(pmLineProduct.CoverageSymbolGroupPatterns.CoverageSymbolGroupPattern != null){%>
  <CoverageSymbolGroupPatterns>
<%for (sgp in pmLineProduct.CoverageSymbolGroupPatterns.CoverageSymbolGroupPattern) {%>
    <CoverageSymbolGroupPattern
      codeIdentifier="${sgp.CodeIdentifier}"
      priority="${sgp.Priority.toString()}"
      public-id="${sgp.PublicId}">
      <CoverageSymbolPatterns>
<%for (sp in sgp.CoverageSymbolPatterns.CoverageSymbolPattern) {%>
        <CoverageSymbolPattern
          codeIdentifier="${sp.CodeIdentifier}"
          coverageSymbolType="${sp.CoverageSymbolType}"
          public-id="${sp.PublicId}"/>
<%}%>
      </CoverageSymbolPatterns>
<%}%>
  </CoverageSymbolGroupPatterns>
<%}%>
<%if(pmLineProduct.InitializeScript != null){%>
  <InitializeScript>${APDStringUtil.makeScriptXmlCdataString(pmLineProduct.InitializeScript)}</InitializeScript>
<%}%>
<%if(pmLineProduct.ModifierPatterns.ModifierPattern != null){%>
  <ModifierPatterns>
<%for (mp in pmLineProduct.ModifierPatterns.ModifierPattern) {%>
<%if (mp.ModifierDataType=="rate") {%>
    <ModifierPattern
<%
var modifierAttributes = new LinkedHashMap<String, String>()
modifierAttributes.put("codeIdentifier", mp.CodeIdentifier)
if (mp.DefaultMaximum != null) modifierAttributes.put("defaultMaximum", mp.DefaultMaximum.toString())
if (mp.DefaultMinimum != null) modifierAttributes.put("defaultMinimum", mp.DefaultMinimum.toString())
if (mp.DisplayEligibility != null) modifierAttributes.put("displayEligibility", mp.DisplayEligibility.toString())
if (mp.DisplayJustification != null) modifierAttributes.put("displayJustification", mp.DisplayJustification.toString())
if (mp.DisplayRange != null) modifierAttributes.put("displayRange", mp.DisplayRange.toString())
if (mp.DisplayValueFinal != null) modifierAttributes.put("displayValueFinal", mp.DisplayValueFinal.toString())
modifierAttributes.put("lookupTableName", mp.LookupTableName)
modifierAttributes.put("modifierDataType", mp.ModifierDataType)
modifierAttributes.put("modifierSubtype", mp.ModifierSubtype)
modifierAttributes.put("priority", mp.Priority.toString())
modifierAttributes.put("public-id", mp.PublicId)
if (mp.RefCode != null) modifierAttributes.put("refCode", mp.RefCode)
modifierAttributes.put("referenceDateByType", mp.ReferenceDateByType)
if (mp.RenderRateAsMultiplier != null) modifierAttributes.put("renderRateAsMultiplier", mp.RenderRateAsMultiplier.toString())
if (mp.ScheduleRate != null) modifierAttributes.put("scheduleRate", mp.ScheduleRate.toString())
if (mp.SplitOnAnniversary != null) modifierAttributes.put("splitOnAnniversary", mp.SplitOnAnniversary.toString())

var iterator = modifierAttributes.entrySet().iterator()
while (iterator.hasNext()) {
    var entry = iterator.next()
%>
      ${entry.Key}="${entry.Value}"<%if (!iterator.hasNext()){%>><%}%>
<%}%>
<%if (mp.AvailabilityScript != null) {%>
      <AvailabilityScript>${APDStringUtil.makeScriptXmlCdataString(mp.AvailabilityScript)}</AvailabilityScript>
<%}%>
<%if (mp.ScheduleRate == true) {%>
      <RateFactorPatterns>
<%for (rfp in mp.RateFactorPatterns.RateFactorPattern) {%>
        <RateFactorPattern
<%
var rateFactorAttributes = new LinkedHashMap<String, String>()
rateFactorAttributes.put("codeIdentifier", rfp.CodeIdentifier)
if (rfp.DefaultMaximum != null) rateFactorAttributes.put("defaultMaximum", rfp.DefaultMaximum.toString())
if (rfp.DefaultMinimum != null) rateFactorAttributes.put("defaultMinimum", rfp.DefaultMinimum.toString())
rateFactorAttributes.put("lookupTableName", rfp.LookupTableName)
rateFactorAttributes.put("priority", rfp.Priority.toString())
rateFactorAttributes.put("public-id", rfp.PublicId)
rateFactorAttributes.put("rateFactorType", rfp.RateFactorType)
if (rfp.RefCode != null) rateFactorAttributes.put("refCode", rfp.RefCode)

iterator = rateFactorAttributes.entrySet().iterator()
while (iterator.hasNext()) {
    var entry = iterator.next()
%>
          ${entry.Key}="${entry.Value}"<%if (!iterator.hasNext()){%>><%}%>
<%}%>
<%if (rfp.AvailabilityScript != null) {%>
          <AvailabilityScript>${APDStringUtil.makeScriptXmlCdataString(rfp.AvailabilityScript)}</AvailabilityScript>
<%}%>
        </RateFactorPattern>
<%}%>
      </RateFactorPatterns>
<%} else {%>
      <RateFactorPatterns/>
<%}%>
    </ModifierPattern>
<%} else {%>
    <ModifierPattern
<%
var modifierAttributes = new LinkedHashMap<String, String>()
modifierAttributes.put("codeIdentifier", mp.CodeIdentifier)
if (mp.DisplayJustification != null) modifierAttributes.put("displayJustification", mp.DisplayJustification.toString())
modifierAttributes.put("lookupTableName", mp.LookupTableName)
modifierAttributes.put("modifierDataType", mp.ModifierDataType)
modifierAttributes.put("modifierSubtype", mp.ModifierSubtype)
modifierAttributes.put("priority", mp.Priority.toString())
modifierAttributes.put("public-id", mp.PublicId)
if (mp.RefCode != null) modifierAttributes.put("refCode", mp.RefCode)
modifierAttributes.put("referenceDateByType", mp.ReferenceDateByType)
if (mp.TypeList != null) modifierAttributes.put("typeList", mp.TypeList)

var iterator = modifierAttributes.entrySet().iterator()
while (iterator.hasNext()) {
    var entry = iterator.next()
%>
      ${entry.Key}="${entry.Value}"<%if (!iterator.hasNext()){%>><%}%>
<%}%>
<%if (mp.AvailabilityScript != null) {%>
      <AvailabilityScript>${APDStringUtil.makeScriptXmlCdataString(mp.AvailabilityScript)}</AvailabilityScript>
<%}%>
      <RateFactorPatterns/>
    </ModifierPattern>
<%}
}%>
  </ModifierPatterns>
<%}%>
<%// note that Official ID Patterns are currently not supported outside of north america as they need states %>
</PolicyLinePattern>