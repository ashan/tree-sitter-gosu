package gw.pcf.job.audit

uses pcf.JobForward
uses pcf.api.Location

/**
 * Helper code to job/audit/AuditInformationScreen.pcf
 */
@Export
class AuditInformationHelper {
  var currentLocation : Location;
  var policyPeriod : PolicyPeriod

  construct(location : Location, period : PolicyPeriod) {
    currentLocation = location
    policyPeriod = period
  }

  function startAudit(info : AuditInformation) {
    info.InitDate = java.util.Date.CurrentDate
    info.withdrawUnboundPolicyChanges()
    info.startAuditJob()
    info.Bundle.commit()
    currentLocation.commit()
  }

  function updateAuditDetails(info : AuditInformation) {
    currentLocation.startEditing()
    info.setActualAuditMethod(AuditMethod.TC_MANUAL_ACC)
    info.Audit.assignAuditor()
    if (info.Audit.PolicyPeriod.EMPWPCLineExists) {
      nz.co.acc.lob.util.LiableEarningsUtilities_ACC.resetEMPWPCLiableEarnings(info.Audit.PolicyPeriod.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov)
      nz.co.acc.lob.util.LiableEarningsUtilities_ACC.resetBICCodesLiableEarnings(info.Audit.PolicyPeriod.EMPWPCLine.BICCodes)
    }
    if (info.Audit.PolicyPeriod.CWPSLineExists) {
      nz.co.acc.lob.util.LiableEarningsUtilities_ACC.updateShareholderLiableEarnings(info.Audit.PolicyPeriod.CWPSLine)
    }
    currentLocation.commit()
  }

  function waiveAndCommit(info : AuditInformation) {
    currentLocation.startEditing()
    info.markWaived(policyPeriod)
    currentLocation.commit()
  }

  // ChrisA 04/03/2020 JUNO-2391 restart waived FA or Cancel In Progress FA - START
  function restartAudit(info : AuditInformation) {
    info.InitDate = java.util.Date.CurrentDate
    info.withdrawUnboundPolicyChanges()
    info.Waive = false
    if (info.Audit != null) {
      info.Audit.remove()
    }
    info.startAuditJob()
    info.Bundle.commit()
    currentLocation.commit()
    info.logRestarted(policyPeriod) // logs the action
  }

  function cancelAndCommit(info : AuditInformation) {
    currentLocation.startEditing()
    if (info.Audit.ActivePeriods.HasElements) {
      info.Audit.withdraw() // per GW
    }
    if (info.Audit != null) {
      info.Audit.remove()
    }
    info.Waive = false
    currentLocation.commit()
    info.logCancelled(policyPeriod) // logs the action
  }
  // ChrisA 04/03/2020 JUNO-2391 restart waived FA or Cancel In Progress FA - FINISH

  function reviseAndGoToWiz(audit : Audit) {
    var period = audit.revise()
    currentLocation.startEditing()
    (period.Job as Audit).AuditInformation.ActualAuditMethod = AuditMethod.TC_MANUAL_ACC
    (period.Job as Audit).AuditInformation.ReceivedDate = null
    currentLocation.commit()
    JobForward.go(period.Job as Audit, period)
  }

  function transactionSumReversal(audits : AuditInformation[]) : gw.pl.currency.MonetaryAmount {
    return audits.where(\a -> a.ReversalDate != null).sum(policyPeriod.PreferredSettlementCurrency, \a -> a.Audit.PolicyPeriod.TransactionCostRPT)
  }

  function totalCostForLastNonAuditPolicyPeriod(auditInfo : AuditInformation) : gw.pl.currency.MonetaryAmount {
    var basedOn = auditInfo.Audit.PolicyPeriod.BasedOn
    while (basedOn.Job typeis Audit) {
      basedOn = basedOn.BasedOn
    }
    return basedOn.TotalCostRPT
  }

  function reversePremiumReport(info : AuditInformation) {
    currentLocation.startEditing()
    info.Audit.reverse()
    policyPeriod.updateTrendAnalysisValues()
    currentLocation.commit()
  }

  function canViewAuditJob(info : AuditInformation) : boolean {
    return perm.Audit.view
        and info.HasBeenStarted
        and not info.IsReversal
  }

  function canEditAudit(info : AuditInformation) : boolean {
    return perm.Audit.reschedule /* can only edit dates, so this is the correct permission */
        and (not info.HasBeenStarted)
        and (not info.IsWaived)
  }

  function canReviseAudit(info : AuditInformation) : boolean {
    return perm.Audit.revise
        and info.IsFinalAudit
        and info.IsRevisable
  }

  function canReverseAudit(info : AuditInformation) : boolean {
    return perm.Audit.reverse
        and info.IsPremiumReport
        and info.IsComplete
        and (not info.HasBeenReversed)
        and (policyPeriod.CompletedNotReversedFinalAudits.Count == 0)
  }

  function canWaiveAudit(info : AuditInformation) : boolean {
    return perm.Audit.waive
        and not info.IsWaived
        and not info.HasBeenStarted
        and policyPeriod.canBeWaived(info)
  }

  function canStartAudit(info : AuditInformation) : boolean {
    return policyPeriod.Policy.canStartAudit(info.AuditPeriodStartDate) == null
        and info.IsScheduled
        and not info.IsComplete
  }

  // ChrisA 04/03/2020 JUNO-2391 restart waived FA or Cancel In Progress FA - START
  function canCancelAudit(info : AuditInformation) : boolean {
    return (info.IsOpen and
        (!info.IsReversal and !info.IsRevision) or
        info.IsWaived)
  }

  function canRestartAudit(info : AuditInformation) : boolean {
    return info.IsWaived
  }
  // ChrisA 04/03/2020 JUNO-2391 restart waived FA or Cancel In Progress FA - FINISH
}