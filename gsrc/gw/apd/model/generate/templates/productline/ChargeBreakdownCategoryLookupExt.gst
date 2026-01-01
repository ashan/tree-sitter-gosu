<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}"
var extPackage = productLine.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${productLine.CodeIdentifier}ChargeBreakdownCategoryLookupBase

class ${productLine.CodeIdentifier}ChargeBreakdownCategoryLookup extends ${productLine.CodeIdentifier}ChargeBreakdownCategoryLookupBase {

  construct() {
    super()
  }

}