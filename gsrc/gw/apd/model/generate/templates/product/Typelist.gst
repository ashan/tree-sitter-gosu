<% uses gw.apd.model.generate.templates.TemplateComparators
uses gw.api.util.LocaleUtil
uses org.apache.commons.lang.StringEscapeUtils %>
<%@ params(attribute: APDAttribute) %>
<% var defaultLang = LocaleUtil.DefaultLanguageType %>
<% var userLang = User.util.CurrentUser.UserLanguage %>
<?xml version="1.0"?>
<typelist xmlns="http://guidewire.com/typelists" name="${attribute.Typelist}" desc="">
<%for (code in attribute.Codes.sort(TemplateComparators.DropdownEntryOrdering)) {%>
  <typecode
    code="${code.Code}"
<% if (userLang == defaultLang) {%>
    desc="${StringEscapeUtils.escapeXml(code.Description)}"
    name="${StringEscapeUtils.escapeXml(code.Name)}"
<%} else {%>
    desc="${code["Description_" + defaultLang.Code]}"
    name="${code["Name_" + defaultLang.Code]}"
<%}%>
    priority="${code.Sequence}"/>
<%}%>
</typelist>