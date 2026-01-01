<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}"
var extPackage = productLine.LOBPackageName
%>
package ${extPackage}

uses ${basePackage}.${productLine.LinePrefix}LineValidationBase
uses gw.validation.PCValidationContext

@Export
class ${productLine.LinePrefix}LineValidation extends ${productLine.LinePrefix}LineValidationBase {

  construct(context : PCValidationContext, line : entity.${productLine.QualifiedName}) {
    super(context, line)
  }

  override function doValidate() {
    // Add line-specific validation logic here
  }

}
