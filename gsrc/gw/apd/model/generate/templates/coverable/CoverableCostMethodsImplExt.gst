<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
var extPackage = "${coverable.LOBPackageName}.${APDConstants.FINANCIALS}"
%>
package ${extPackage}

uses ${basePackage}.${coverable.QualifiedName}CostMethodsImplBase

@Export
class ${coverable.QualifiedName}CostMethodsImpl extends ${coverable.QualifiedName}CostMethodsImplBase {

  construct(cost : entity.${coverable.QualifiedName}Cost) {
    super(cost)
  }

}