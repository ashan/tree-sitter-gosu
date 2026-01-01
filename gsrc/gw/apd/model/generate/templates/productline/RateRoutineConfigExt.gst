<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.RATING}"
var extPackage = "${productLine.LOBPackageName}.${APDConstants.RATING}"
%>
package ${extPackage}

uses ${basePackage}.${productLine.LinePrefix}RateRoutineConfigBase

@Export
class ${productLine.LinePrefix}RateRoutineConfig extends ${productLine.LinePrefix}RateRoutineConfigBase {

  // no-args constructor required
  construct() {
  }

}