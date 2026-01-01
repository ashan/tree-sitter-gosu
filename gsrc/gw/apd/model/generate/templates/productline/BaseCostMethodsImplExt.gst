<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
var extPackage = "${productLine.LOBPackageName}.${APDConstants.FINANCIALS}"
%>
package ${extPackage}

uses ${basePackage}.${productLine.LinePrefix}CostMethodsImplBase

@Export
class ${productLine.LinePrefix}CostMethodsImpl<T extends ${productLine.LinePrefix}Cost> extends ${productLine.LinePrefix}CostMethodsImplBase {

  construct(owner : entity.${productLine.LinePrefix}Cost) {
    super(owner)
  }

}