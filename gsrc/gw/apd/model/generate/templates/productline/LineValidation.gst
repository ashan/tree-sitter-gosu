<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.locale.DisplayKey
uses gw.policy.PolicyLineValidation
uses gw.validation.PCValidationContext

@Export
abstract class ${productLine.LinePrefix}LineValidationBase extends PolicyLineValidation<entity.${productLine.QualifiedName}> {

  construct(context : PCValidationContext, line : entity.${productLine.QualifiedName}) {
    super(context, line)
  }

  property get ${productLine.LinePrefix.toLowerCase()}Line() : entity.${productLine.QualifiedName} {
    return Line
  }

  /**
   * Validation for Audit is not supported
   */
  override function validateLineForAudit() {
    throw new UnsupportedOperationException(DisplayKey.get("Validator.UnsupportedAuditLineError"))
  }

}
