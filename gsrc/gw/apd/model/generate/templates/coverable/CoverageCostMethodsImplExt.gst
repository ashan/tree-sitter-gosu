<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
var extPackage = "${coverable.LOBPackageName}.${APDConstants.FINANCIALS}"
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}CovCostMethodsImplBase

@Export
class ${coverable.QualifiedName}CovCostMethodsImpl extends ${coverable.QualifiedName}CovCostMethodsImplBase {

  construct(cost : entity.${coverable.QualifiedName}CovCost) {
    super(cost)
  }

}