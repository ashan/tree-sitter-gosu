<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}"
var extPackage = productLine.LOBPackageName
%>
package ${extPackage}

uses ${extPackage}.${APDConstants.RATING}.${productLine.LinePrefix}RatingEngine
uses ${basePackage}.${productLine.LinePrefix}PolicyLineMethodsBase
uses gw.validation.PCValidationContext

@Export
class ${productLine.LinePrefix}PolicyLineMethods extends ${productLine.LinePrefix}PolicyLineMethodsBase {

  construct(line : entity.${productLine.QualifiedName}) {
    super(line)
  }

  override function createRatingEngine(method : RateMethod, parameters : Map<RateEngineParameter, Object>) : ${productLine.LinePrefix}RatingEngine {
    return new ${productLine.LinePrefix}RatingEngine(Line as productmodel.${productLine.CodeIdentifier}, parameters[RateEngineParameter.TC_RATEBOOKSTATUS] as RateBookStatus)
  }

  override function createPolicyLineValidation(validationContext : PCValidationContext) : ${productLine.LinePrefix}LineValidation {
    return new ${productLine.LinePrefix}LineValidation(validationContext, Line)
  }

  override function createPolicyLineDiffHelper(reason : typekey.DiffReason, policyLine : entity.PolicyLine) : ${productLine.LinePrefix}DiffHelper {
    return new ${productLine.LinePrefix}DiffHelper(reason, Line, policyLine as entity.${productLine.QualifiedName})
  }

}