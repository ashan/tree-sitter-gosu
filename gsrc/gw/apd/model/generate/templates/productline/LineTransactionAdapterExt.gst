<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
var extPackage = "${productLine.LOBPackageName}.${APDConstants.FINANCIALS}"
%>
package ${extPackage}

uses ${basePackage}.${productLine.LinePrefix}TransactionAdapterBase

@Export
class ${productLine.LinePrefix}TransactionAdapter extends ${productLine.LinePrefix}TransactionAdapterBase {

  construct(owner : entity.${productLine.LinePrefix}Transaction) {
    super(owner)
  }

}