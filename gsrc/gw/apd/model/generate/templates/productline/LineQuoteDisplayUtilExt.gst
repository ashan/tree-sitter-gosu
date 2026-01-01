<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
var extPackage = "${productLine.LOBPackageName}.${APDConstants.FINANCIALS}"
%>
package ${extPackage}

uses ${basePackage}.${productLine.LinePrefix}QuoteDisplayUtilBase

@Export
class ${productLine.LinePrefix}QuoteDisplayUtil extends ${productLine.LinePrefix}QuoteDisplayUtilBase {

  construct(line : entity.${productLine.QualifiedName}, forCosts : Boolean) {
    super(line, forCosts)
  }

}