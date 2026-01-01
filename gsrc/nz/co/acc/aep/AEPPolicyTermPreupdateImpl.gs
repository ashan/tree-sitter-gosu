package nz.co.acc.aep

uses gw.api.util.DisplayableException

class AEPPolicyTermPreupdateImpl {

  static final var _instance : AEPPolicyTermPreupdateImpl as readonly Instance = new AEPPolicyTermPreupdateImpl()

  /**
   * The rules for Policy period
   *
   * @param entity
   */
  function executePreUpdate(entity: KeyableBean) {
    if (entity typeis PolicyTerm) {
      triggerRenewMasterPolicyActivity(entity)
    }
  }

  private function triggerRenewMasterPolicyActivity(policyTerm : PolicyTerm) {
    if (policyTerm.ChangedFields.contains("AEPAuditCompletionDate_ACC") and
        policyTerm.getOriginalValue("AEPAuditCompletionDate_ACC") == null and
        policyTerm.AEPAuditCompletionDate_ACC != null and
        not policyTerm.Policy.AllOpenActivities.hasMatch(\act -> act.ActivityPattern.Code == "aep_renew_master_policy_acc")) {
      var activityPattern = ActivityPattern.finder.getActivityPatternByCode("aep_renew_master_policy_acc")
      if (activityPattern != null) {
        var targetDate = policyTerm.AEPAuditCompletionDate_ACC.addDays(activityPattern.TargetDays)
        var escalationDate = targetDate.addBusinessDays(activityPattern.EscalationDays)
        var activity = activityPattern.createPolicyActivity(policyTerm.Bundle, policyTerm.Policy, null, null, null, null, null, null, null)
        activity.setTargetDate(targetDate)
        activity.setEscalationDate(escalationDate)
      } else {
        throw new DisplayableException("Activity pattern 'aep_renew_master_policy_acc' cannot be found")
      }
    }
  }
}