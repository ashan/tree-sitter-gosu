<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
%>
package ${basePackage}

/**
 * Additional methods and properties provided by the costs that supply this interface.
 */
@Export
interface ${productLine.LinePrefix}CostMethods {

  property get Coverage() : Coverage

  property get OwningCoverable() : Coverable

  property get Jurisdiction() : Jurisdiction

}