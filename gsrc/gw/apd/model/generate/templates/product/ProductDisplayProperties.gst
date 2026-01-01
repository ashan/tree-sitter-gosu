<%@ params(product: APDProduct, lang : LanguageType) %>
<%if(product["Name_" + lang.Code] != null){%>Product_${product.CodeIdentifier}.Name = ${product["Name_" + lang.Code]}
<%}%>
<%if(product["Description_" + lang.Code] != null){%>Product_${product.CodeIdentifier}.Description = ${product["Description_" + lang.Code]}
<%}%>