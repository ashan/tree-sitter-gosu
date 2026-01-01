<%@ params(product: APDProduct, line: APDProductLine, lang : LanguageType) %>
<%if(line["Name_" + lang.Code] != null){%>Web.LineWizardMenu.${product.CodeIdentifier}.${line.CodeIdentifier} = ${line["Name_" + lang.Code]}
Web.PolicyFile.ProductLine.${product.CodeIdentifier}.${line.CodeIdentifier} = ${line["Name_" + lang.Code]}
Web.PolicyFile.Line.${line.LinePrefix}.${line.CodeIdentifier} = ${line["Name_" + lang.Code]}
<%}%>

