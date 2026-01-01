<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
var extPackage = "${productLine.LOBPackageName}.${APDConstants.FINANCIALS}"
%>
package ${extPackage}

uses ${basePackage}.${productLine.LinePrefix}CostAdapterBase

@Export
class ${productLine.LinePrefix}CostAdapter extends ${productLine.LinePrefix}CostAdapterBase {

  construct(owner : entity.${productLine.LinePrefix}Cost) {
    super(owner)
  }

}