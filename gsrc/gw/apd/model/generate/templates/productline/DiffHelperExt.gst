<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}"
var extPackage = productLine.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${productLine.LinePrefix}DiffHelperBase

@Export
class ${productLine.LinePrefix}DiffHelper extends ${productLine.LinePrefix}DiffHelperBase {

  construct(reason : DiffReason, line1 : entity.${productLine.QualifiedName}, line2 : entity.${productLine.QualifiedName}) {
    super(reason, line1, line2)
  }

}