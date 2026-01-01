package gw.job

uses gw.api.locale.DisplayKey
uses gw.api.system.PLLoggerCategory
uses gw.plugin.messaging.BillingMessageTransport
uses typekey.Job

enhancement AuditInformationEnhancement : AuditInformation {

  /**
   * Returns the Audit job that revises this current Audit
   */
  property get RevisingAudit() : Audit {
    var policyPeriod = this.Audit.PolicyPeriod
    return this.Audit.Policy.Jobs.whereTypeIs(Audit)
        .firstWhere(\audit ->
            audit.PolicyPeriod.BasedOn == policyPeriod
                and not audit.AuditInformation.IsWaived
                and not audit.AuditInformation.IsWithdrawn
                and not audit.AuditInformation.IsReversal)
  }

  property get DisplayStatus() : String {
    if (this.Audit == null) {
      return (IsWaived
          ? DisplayKey.get("Audit.DisplayStatus.Waived")
          : DisplayKey.get("Audit.DisplayStatus.Scheduled"))
    } else {
      if (IsOpen) {
        return DisplayKey.get("Audit.DisplayStatus.InProgress")
      } else if (this.RevisingAudit != null) {
        return DisplayKey.get("Audit.DisplayStatus.Revised")
      } else {
        return this.Audit.PolicyPeriod.Status.DisplayName
      }
    }
  }

  property get BasedOnFinalAuditInfo() : AuditInformation {
    var info = this
    if (HasBeenStarted) {
      var auditPeriod = this.Audit.PolicyPeriod
      while (auditPeriod.Audit.AuditInformation.RevisionType != null) {
        auditPeriod = auditPeriod.BasedOn
      }
      info = auditPeriod.Audit.AuditInformation
    }
    return info
  }

  property get UserCanWaive() : boolean {
    return AuditProcess.canWaive().Okay and
        not IsRevision and
        ScriptParameters.AllowFinalAuditsToBeWaived_ACC
  }

  property get UserCanWithdraw() : boolean {
    return AuditProcess.canWithdraw().Okay and IsRevision
  }

  private property get AuditProcess() : AuditProcess {
    return this.Audit.PolicyPeriod.AuditProcess
  }

  property get BasedOnIfReversal() : AuditInformation {
    return (IsReversal
        ? this.Audit.PolicyPeriod.BasedOn.Audit.AuditInformation
        : this)
  }

  property get HasBeenReversed() : boolean {
    return this.ReversalDate != null
  }

  property get HasBeenStarted() : boolean {
    return this.Audit != null
  }

  property get IsScheduled() : boolean {
    return not(HasBeenStarted or IsWaived)
  }

  property get IsFinalAudit() : boolean {
    return this.AuditScheduleType == TC_FINALAUDIT
  }

  property get IsPremiumReport() : boolean {
    return this.AuditScheduleType == TC_PREMIUMREPORT
  }

  property get IsCheckingAudit() : boolean {
    return this.AuditScheduleType == TC_CHECKINGAUDIT
  }

  property get IsRevision() : boolean {
    return this.RevisionType == TC_REVISION
  }

  property get IsReversal() : boolean {
    return this.RevisionType == TC_REVERSAL
  }

  property get IsComplete() : boolean {
    return this.Audit.PolicyPeriod.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE
  }

  property get IsWithdrawn() : boolean {
    return this.Audit.PolicyPeriod.Status == PolicyPeriodStatus.TC_WITHDRAWN
  }

  property get IsWaived() : boolean {
    return this.Waive
  }

  property get IsOpen() : boolean {
    return HasBeenStarted and not(IsComplete or IsWithdrawn or IsWaived)
  }

  property get IsSeries() : boolean {
    return this.Series
  }

  /**
   * Audit is revisable if it has been completed and was not waived, reversed or already revised
   */
  property get IsRevisable() : boolean {
    return HasBeenStarted
        and IsComplete
        and not IsWithdrawn
        and not IsWaived
        and not IsReversal
        and not HasBeenReversed
        and RevisingAudit == null
  }

  property get UIDisplayName() : String {
    return (IsRevision
        ? revisionDisplayName()
        : (IsReversal
        ? reversalDisplayName() :
        this.AuditScheduleType.DisplayName))
  }

  function markWaived(branch : PolicyPeriod) {
    this.Waive = true
    branch.addEvent(PolicyPeriod.WAIVEFINALAUDIT_EVENT)
  }

  // ChrisA 04/03/2020 JUNO-2391 restart waived FA or Cancel In Progress FA - START
  function logCancelled(branch : PolicyPeriod) {
    PLLoggerCategory.CONFIG.debug("Audit Cancelled for ${branch.ACCPolicyID_ACC} on levy year ${branch.LevyYear_ACC}")
  }

  function logRestarted(branch : PolicyPeriod) {
    PLLoggerCategory.CONFIG.debug("Audit Restarted for ${branch.ACCPolicyID_ACC} on levy year ${branch.LevyYear_ACC}")
  }
  // ChrisA 04/03/2020 JUNO-2391 restart waived FA or Cancel In Progress FA - FINISH

  //
  // PRIVATE SUPPORT FUNCTIONS
  //
  private function revisionDisplayName() : String {
    return BasedOnFinalAuditInfo.UIDisplayName + " " + RevisionType.TC_REVISION.DisplayName
  }

  private function reversalDisplayName() : String {
    return this.Audit.PolicyPeriod.BasedOn.Audit.AuditInformation.UIDisplayName + " " + RevisionType.TC_REVERSAL.DisplayName
  }

  /**
   * feature/DE4506_Withdraw_unbound_policy_changes_on_audit_start
   * 02.11.2018 NowchoO - withdraw all unbound policy changes for this audit's policy period.
   */
  public function withdrawUnboundPolicyChanges() {
    if (!(ScriptParameters.getParameterValue("WithdrawUnboundPolicyChangesOnAuditEnabled_ACC") as boolean)) {
      PLLoggerCategory.CONFIG.debug("withdrawUnboundPolicyChanges() not executed")
      return
    }
    var unboundPolicyChangeJobs = this.PolicyTerm?.Jobs.where(\job -> job.Subtype == Job.TC_POLICYCHANGE
        && (job.SelectedVersion.Status == PolicyPeriodStatus.TC_DRAFT
        || job.SelectedVersion.Status == PolicyPeriodStatus.TC_QUOTED))
    for (job in unboundPolicyChangeJobs) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        job = bundle.add(job)
        job.withdraw()
      })
    }
  }
}
