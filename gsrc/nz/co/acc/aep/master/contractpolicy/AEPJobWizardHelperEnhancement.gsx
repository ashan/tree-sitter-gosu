package nz.co.acc.aep.master.contractpolicy

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.web.job.JobWizardHelper
uses pcf.api.Location

/**
 * Created by madhav.mandayam on 07-Jun-17.
 */
enhancement AEPJobWizardHelperEnhancement: JobWizardHelper {
  function postToBC_ACC(policyPeriod : PolicyPeriod, currentLocation : Location) {
    if (!policyPeriod.IsAEPMasterPolicy_ACC)
      return
    if (not policyPeriod.Policy.Account.getAEPActiveMemberPoliciesForLevyYear_ACC(policyPeriod.LevyYear_ACC).HasElements) {
      throw new DisplayableException(DisplayKey.get("Web.AEP_ACC.Account.Validation.AEPAccountHasNoMemberPolicies"))
    }
    policyPeriod.PolicyTerm.AEPPhase_ACC = AEPPhase_ACC.TC_READY_FOR_BC
    policyPeriod.AEPLine.clearExistingAEPMemberData_ACC()
    policyPeriod.AEPLine.clearExistingAEPRateableCUData_ACC()
    policyPeriod.AEPLine.createAndMapAEPMemberAndRateableData_ACC()
    this.validateAndSaveDraft()
    if (policyPeriod.AEPLine.AEPMemberData.HasElements)
      this.goToStep("AEPMemberCUData")
  }

}
