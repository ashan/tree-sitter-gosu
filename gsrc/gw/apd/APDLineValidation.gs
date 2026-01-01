package gw.apd

uses gw.api.locale.DisplayKey
uses gw.policy.PolicyLineValidation
uses gw.validation.PCValidationContext

@Export
class APDLineValidation extends PolicyLineValidation<entity.APDManualPolicyLine> {
  
  property get apdLine(): entity.APDManualPolicyLine {
    return Line
  }

  construct(valContext: PCValidationContext, polLine: entity.APDManualPolicyLine) {
    super(valContext, polLine)
  }
  
  override function doValidate() {
    validateRequiredForQuoteBindAndIssueRules()
  }

  /**
   * Validation for Audit is not supported
   */
  override function validateLineForAudit() {
    throw new UnsupportedOperationException(DisplayKey.get("Validator.UnsupportedAuditLineError"))
  }

  private function validateRequiredForQuoteBindAndIssueRules() {
    Context.addToVisited(this, "validateRequiredForQuoteBindAndIssueRules")
    if  (not Context.isAtLeast(TC_DEFAULT)) {
      return
    }

    var allRiskAttributesByAvailability = getAllRiskAttributes().partition(\ra -> ra.Availability)

    // Issuance should validate bind and quote-time required attributes as well.
    // Bind should check for quote-time required attributes too.
    // Quote should only check for quote-time required attributes.
    if (Context.isAtLeast(TC_READYFORISSUE)) {
      var requiredAttributesForIssue =  allRiskAttributesByAvailability.get(APDDataExistenceType.TC_CAPTUREDISSUE)
      validateRequiredAttributes(requiredAttributesForIssue, TC_READYFORISSUE)
    }

    if (Context.isAtLeast(TC_BINDABLE)) {
      var requiredAttributesForBind = allRiskAttributesByAvailability.get(APDDataExistenceType.TC_CAPTUREDBIND)
      validateRequiredAttributes(requiredAttributesForBind, TC_BINDABLE)
    }

    if (Context.isAtLeast(TC_QUOTABLE)) {
      var requiredAttributesForQuote = allRiskAttributesByAvailability.get(APDDataExistenceType.TC_CAPTUREDQUOTE)
      validateRequiredAttributes(requiredAttributesForQuote, TC_QUOTABLE)
    }
  }

  private function getAllRiskAttributes() : APDDataField[] {
    var allRiskAttributes = new ArrayList<APDDataField>()
    allRiskAttributes.addAll(apdLine.RiskCoverables*.AllRiskCoverables.arrays("RiskFields"))
    allRiskAttributes.addAll(apdLine.RiskCoverables*.AllRiskExposures.arrays("Fields"))
    allRiskAttributes.addAll(apdLine.RiskCoverables*.AllRiskCoverables.arrays("RiskClauses").toArray(new APDRiskClause[0]).arrays("RiskTerms"))
    return allRiskAttributes.toTypedArray()
  }

  private function validateRequiredAttributes(riskAttributes : List<APDDataField>, level : ValidationLevel) {
    for(var riskAttribute in riskAttributes) {

      if (riskAttribute.DisplayValue.Empty) {
        // build the error message
        var ownerName = getAttributeOwnerName(riskAttribute)
        ownerName = (ownerName.NotBlank) ? ownerName + ": " : ""

        var errorMessage : String
        if (level == ValidationLevel.TC_QUOTABLE) {
          if (riskAttribute typeis APDRiskField) {
            errorMessage = DisplayKey.get("Web.Policy.ManualLine.Validation.MissingFieldValueForQuote", riskAttribute.Attribute.Label)
          } else if (riskAttribute typeis APDRiskExposureField) {
            errorMessage = DisplayKey.get("Web.Policy.ManualLine.Validation.MissingExposureFieldValueForQuote", riskAttribute.Attribute.Label)
          } else if (riskAttribute typeis APDRiskTerm) {
            errorMessage = DisplayKey.get("Web.Policy.ManualLine.Validation.MissingTermValueForQuote", riskAttribute.RiskClause.Clause.ClauseTypeForUIMessage, riskAttribute.Attribute.Label)
          }
          errorMessage += getValueStringForError(riskAttribute.Attribute)
          Result.addError(apdLine, level, ownerName + errorMessage)
        } else if (level == ValidationLevel.TC_BINDABLE) {
          if (riskAttribute typeis APDRiskField) {
            errorMessage = DisplayKey.get("Web.Policy.ManualLine.Validation.MissingFieldValueForBind", riskAttribute.Attribute.Label)
          } else if (riskAttribute typeis APDRiskExposureField) {
            errorMessage = DisplayKey.get("Web.Policy.ManualLine.Validation.MissingExposureFieldValueForBind", riskAttribute.Attribute.Label)
          } else if (riskAttribute typeis APDRiskTerm) {
            errorMessage = DisplayKey.get("Web.Policy.ManualLine.Validation.MissingTermValueForBind", riskAttribute.RiskClause.Clause.ClauseTypeForUIMessage, riskAttribute.Attribute.Label)
          }
          errorMessage += getValueStringForError(riskAttribute.Attribute)
          Result.addError(apdLine, level, ownerName + errorMessage)
        } else if (level == ValidationLevel.TC_READYFORISSUE) {
          if (riskAttribute typeis APDRiskField) {
            errorMessage = DisplayKey.get("Web.Policy.ManualLine.Validation.MissingFieldValueForIssue", riskAttribute.Attribute.Label)
          } else if (riskAttribute typeis APDRiskExposureField) {
            errorMessage = DisplayKey.get("Web.Policy.ManualLine.Validation.MissingExposureFieldValueForIssue", riskAttribute.Attribute.Label)
          } else if (riskAttribute typeis APDRiskTerm) {
            errorMessage = DisplayKey.get("Web.Policy.ManualLine.Validation.MissingTermValueForIssue", riskAttribute.RiskClause.Clause.ClauseTypeForUIMessage, riskAttribute.Attribute.Label)
          }
          errorMessage += getValueStringForError(riskAttribute.Attribute)
          Result.addError(apdLine, level, ownerName + errorMessage)
        }
      }
    }
  }

  private function getAttributeOwnerName(riskAttribute : APDDataField) : String {
    if (riskAttribute typeis APDRiskField) {
      return riskAttribute.RiskCoverable.DisplayName
    } else if (riskAttribute typeis APDRiskExposureField) {
      return riskAttribute.RiskExposure.DisplayName
    } else if (riskAttribute typeis APDRiskTerm) {
      return riskAttribute.RiskClause.RiskCoverable.DisplayName + ": " + riskAttribute.RiskClause.DisplayName
    } else {
      return ""
    }
  }

  private function getValueStringForError(attribute : APDAttribute) : String {
    var typesThatAllowSelect = {APDFieldType.TC_TYPEKEY, APDFieldType.TC_BOOLEAN, APDFieldType.TC_LOCATION, APDFieldType.TC_PARTY}
    var message = " "
    message += typesThatAllowSelect.contains(attribute.Type) ?
        DisplayKey.get("Web.Policy.ManualLine.Validation.SelectValue") :  DisplayKey.get("Web.Policy.ManualLine.Validation.EnterValue")
    return message
  }
}