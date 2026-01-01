<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine:ProductLine) %>
package ${productLine.LOBPackageName}

uses gw.api.locale.DisplayKey
uses gw.validation.PCValidationContext
uses gw.policy.PolicyLineValidation
uses java.lang.UnsupportedOperationException

@Export
class ${productLine.ValidationName} extends PolicyLineValidation<entity.${productLine.EntityName}> {
  
  property get ${productLine.AbbrevationLowerCase}Line(): entity.${productLine.EntityName} {
    return Line
  }

  construct(valContext: PCValidationContext, polLine: entity.${productLine.EntityName}) {
    super(valContext, polLine)
  }
  
  override function doValidate() {
    // Add line-specific validation logic here
  }

  /**
   * Validation for Audit is not supported
   */
  override function validateLineForAudit() {
    throw new UnsupportedOperationException(DisplayKey.get("Validator.UnsupportedAuditLineError"))
  }
}
