package nz.co.acc.lob.aep

uses gw.api.locale.DisplayKey
uses gw.validation.PCValidationContext
uses gw.policy.PolicyLineValidation
uses java.lang.UnsupportedOperationException

@Export
class AEPLineValidation extends PolicyLineValidation<entity.AEPLine_ACC> {
  
  property get aepLine(): entity.AEPLine_ACC {
    return Line
  }

  construct(valContext: PCValidationContext, polLine: entity.AEPLine_ACC) {
    super(valContext, polLine)
  }
  
  override function doValidate() {
    // Add line-specific validation logic here
    validateContractDetails()
  }

  /**
   * Validation for Audit is not supported
   */
  override function validateLineForAudit() {
    validateLineForAudit_ACC()
    validateContractDetails()
  }

  override function validateCoveragesForAudit_ACC() {
    // No validation checks required for AEP Audit details page
  }

  function validateContractDetails() {
    Context.addToVisited(this, "validateContractDetails")
    if (Context.isAtLeast(TC_QUOTABLE)) {
      if (aepLine.ContractPlanType == null) {
        Result.addError(aepLine, TC_DEFAULT, DisplayKey.get("Web.AEP_ACC.ContractDetails.Validation.ContractPlanTypeIsRequired"),"AEPContractDetailsScreen")
      }
      if (aepLine.ClaimManagementPeriod == null) {
        Result.addError(aepLine, TC_DEFAULT, DisplayKey.get("Web.AEP_ACC.ContractDetails.Validation.ClaimManagementPeriodIsRequired"),"AEPContractDetailsScreen")
      }
      if (aepLine.ContractPlanType == AEPContractPlanType_ACC.TC_FULL_SELF_COVER and aepLine.StopLossPercentage == null) {
        Result.addError(aepLine, TC_DEFAULT, DisplayKey.get("Web.AEP_ACC.ContractDetails.Validation.StopLossLimitIsRequired"),"AEPContractDetailsScreen")
      }
    }
  }
}