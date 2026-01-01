<% uses gw.api.util.LocaleUtil %>
<%@ params(productLine: APDProductLine, lang : LanguageType) %>
<% var defaultLang = LocaleUtil.getDefaultLanguageType() %>
TypeKey.InstalledPolicyLine.${productLine.LinePrefix} = ${productLine.CodeIdentifier}
<% if (lang == defaultLang) {%>
TypeKeyDescription.InstalledPolicyLine.${productLine.LinePrefix} = ${productLine.Description}
<%} else {%>
TypeKeyDescription.InstalledPolicyLine.${productLine.LinePrefix} = ${productLine["Description_" + lang.Code]}
<%}%>

