package nz.co.acc.job.audit

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.lob.common.DateUtil_ACC
uses typekey.Job
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

/**
 * Created by eliyaz.shaik on 5/30/2017.
 */
class AuditHelper_ACC {

  public static function updateFollowingYearProvisionalsFromAudit(polPeriod : PolicyPeriod, audit : Audit){
    var nextYearsPolicyPeriod = polPeriod.Policy.CompletedPeriodsWithCost.orderByDescending(\row -> row.CreateTime).firstWhere(\elt -> elt.PeriodEnd.YearOfDate == polPeriod.PeriodEnd.YearOfDate + 1)
    // Do the following only in the Revise Audit flow and if the Ceased Trading Flag is set to TRUE
    if(audit.AuditInformation.RevisionType == RevisionType.TC_REVISION){
      if(nextYearsPolicyPeriod != null){
        var finalAuditExists = nextYearsPolicyPeriod.Policy.CompletedPeriodsWithCost.countWhere(\elt -> elt.PeriodEnd.YearOfDate == nextYearsPolicyPeriod.PeriodEnd.YearOfDate and elt.Job.Subtype == typekey.Job.TC_AUDIT) >= 1
        if(!finalAuditExists){
          // WPC Policy
          if (nextYearsPolicyPeriod.EMPWPCLineExists and nextYearsPolicyPeriod.EMPWPCLine.EMPWPCCovs?.length >= 1) {
            if(!polPeriod.BasedOn.CeasedTrading_ACC and polPeriod.CeasedTrading_ACC){
              gw.transaction.Transaction.runWithNewBundle(\b -> {
                var policyChange = new PolicyChange(b)
                policyChange.startJob(nextYearsPolicyPeriod.Policy, nextYearsPolicyPeriod.PeriodStart)
                var policyChangePeriod = policyChange.LatestPeriod

                //Removing the Liable Earnings
                LiableEarningsUtilities_ACC.resetEMPWPCLiableEarnings(policyChangePeriod.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov)
                setActiveTermFlagFieldsAndIssuePolicy(polPeriod, policyChangePeriod, false)
              })
            }
            else if(polPeriod.BasedOn.CeasedTrading_ACC and !polPeriod.CeasedTrading_ACC){
              gw.transaction.Transaction.runWithNewBundle(\b -> {
                var policyChange = new PolicyChange(b)
                b.add(polPeriod.PolicyTerm)
                policyChange.startJob(nextYearsPolicyPeriod.Policy, nextYearsPolicyPeriod.PeriodStart)
                var policyChangePeriod = policyChange.LatestPeriod

                //Copying the Liable Earnings from Final Audit
                LiableEarningsUtilities_ACC.copyEMPWPCLiableEarnings(polPeriod.EMPWPCLine.EMPWPCCovs.first(), policyChangePeriod.EMPWPCLine.EMPWPCCovs.first())
                setActiveTermFlagFieldsAndIssuePolicy(polPeriod, policyChangePeriod, true)
              })
            }
          }
          // CWPS Policy
          else if(polPeriod.CWPSLineExists){
            if(!polPeriod.BasedOn.CeasedTrading_ACC and polPeriod.CeasedTrading_ACC){
              gw.transaction.Transaction.runWithNewBundle(\b -> {
                var policyChange = new PolicyChange(b)
                policyChange.startJob(nextYearsPolicyPeriod.Policy, nextYearsPolicyPeriod.PeriodStart)
                var policyChangePeriod = policyChange.LatestPeriod

                //Removing the Policy Share holders
                policyChangePeriod.CWPSLine.PolicyShareholders={}
                setActiveTermFlagFieldsAndIssuePolicy(polPeriod, policyChangePeriod, false)
              })
            }
            else if(polPeriod.BasedOn.CeasedTrading_ACC and !polPeriod.CeasedTrading_ACC){
              //Copy the BIC Codes
              //var policyChangePeriod = createPolicyChangePolicyPeriod(polPeriod)
              gw.transaction.Transaction.runWithNewBundle(\b -> {
                var policyChange = new PolicyChange(b)
                policyChange.startJob(nextYearsPolicyPeriod.Policy, nextYearsPolicyPeriod.PeriodStart)
                var policyChangePeriod = policyChange.LatestPeriod

                LiableEarningsUtilities_ACC.copyCWPSBICCodes(polPeriod, policyChangePeriod)
                //Copying the Policy Share holders from Final Audit
                LiableEarningsUtilities_ACC.copyCWPSPolicyShareholders(polPeriod, policyChangePeriod)
                setActiveTermFlagFieldsAndIssuePolicy(polPeriod, policyChangePeriod, true)
              })
            }
          }
        }

      }
    }
  }

  public static function setActiveTermFlagFieldsAndIssuePolicy(srcPolPeriod : PolicyPeriod, destPolPeriod : PolicyPeriod, activeTerm : boolean){
    destPolPeriod.PolicyTerm.ActiveTerm_ACC = activeTerm
    destPolPeriod.PolicyChangeProcess.requestQuote()
    destPolPeriod.PolicyChangeProcess.issueJob(true) // bind and issue
  }

  public static function updateProvisionalRefund(policyPeriod : PolicyPeriod) {
    if (policyPeriod.CWPSLineExists) {
      updateWPSProvisionalForRefund(policyPeriod)
    } else if (policyPeriod.EMPWPCLineExists) {
      updateWPCProvisionalForRefund(policyPeriod)
    }
  }

  public static function ceaseFinalAuditWithFinalAuditRevision(finalAuditPeriod : PolicyPeriod) : PolicyPeriod {
    var bundle : Bundle
    gw.transaction.Transaction.runWithNewBundle( \ b -> { bundle = b } )
    var editableFinalAuditPeriod = bundle.add(finalAuditPeriod)
    var newPeriod = editableFinalAuditPeriod.Audit.revise()
    var auditInformation = newPeriod.Audit.AuditInformation

    auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
    auditInformation.ReceivedDate = Date.CurrentDate
    newPeriod.CeasedTradingDate_ACC = finalAuditPeriod.PeriodEnd

    var auditProcess = newPeriod.AuditProcess
    if (auditProcess.canRequestQuote().Okay) {
      auditProcess.requestQuote()
    }
    if (auditProcess.canComplete().Okay) {
      auditProcess.complete()
    }
    bundle.commit()
    return newPeriod
  }

  private static function updateWPSProvisionalForRefund(policyPeriod : PolicyPeriod) {
    // Create a WPS policy change bundle
    var bundle : Bundle
    gw.transaction.Transaction.runWithNewBundle( \ b -> { bundle = b } )
    var policyChange: PolicyChange
    policyChange = new PolicyChange(bundle)
    var effDate = policyPeriod.PeriodStart
    policyChange.startJob(policyPeriod.Policy, effDate)

    var newPeriod = policyChange.Periods[0]
    // Set the costs to zero
    LiableEarningsUtilities_ACC.setCWPSLiableEarningsToZero(newPeriod.CWPSLine)
    newPeriod.PolicyChangeProcess.requestQuote()
    newPeriod.PolicyChangeProcess.issueJob(true)

    bundle.commit()
  }

  private static function updateWPCProvisionalForRefund(policyPeriod : PolicyPeriod) {
    // Create a WPS policy change bundle
    var bundle : Bundle
    gw.transaction.Transaction.runWithNewBundle( \ b -> { bundle = b } )
    var policyChange: PolicyChange
    policyChange = new PolicyChange(bundle)
    var effDate = policyPeriod.PeriodStart
    policyChange.startJob(policyPeriod.Policy, effDate)

    var newPeriod = policyChange.Periods[0]
    // Set the costs to zero
    LiableEarningsUtilities_ACC.setEMPWPCLiableEarningsToZero(newPeriod.EMPWPCLine.EMPWPCCovs.first())
    newPeriod.PolicyChangeProcess.requestQuote()
    newPeriod.PolicyChangeProcess.issueJob(true)

    bundle.commit()
  }

  public static function updateProvisionalOfFollowingYear(srcPolicyPeriod : PolicyPeriod){
    // Ceased Trading Flag is UnChecked from Checked of the BasedOn Period
    if(srcPolicyPeriod.BasedOn?.CeasedTrading_ACC and !srcPolicyPeriod.CeasedTrading_ACC){
      var nextYearsPolicyPeriod = srcPolicyPeriod.Policy.CompletedPeriodsWithCost.orderByDescending(\row -> row.CreateTime).firstWhere(\elt -> elt.PeriodEnd.YearOfDate == srcPolicyPeriod.PeriodEnd.YearOfDate + 1)
      if(nextYearsPolicyPeriod != null) {
        if(srcPolicyPeriod.CWPSLineExists){
          gw.transaction.Transaction.runWithNewBundle(\b -> {
            var policyChange = new PolicyChange(b)
            policyChange.startJob(nextYearsPolicyPeriod.Policy, nextYearsPolicyPeriod.PeriodStart)
            var policyChangePeriod = policyChange.LatestPeriod
            //Copy the BIC Codes
            LiableEarningsUtilities_ACC.copyCWPSBICCodes(srcPolicyPeriod, policyChangePeriod)
            //Copying the Policy Share holders from Final Audit
            LiableEarningsUtilities_ACC.copyCWPSPolicyShareholders(srcPolicyPeriod, policyChangePeriod)
            nz.co.acc.job.audit.AuditHelper_ACC.setActiveTermFlagFieldsAndIssuePolicy(srcPolicyPeriod, policyChangePeriod, true)
          })
        }
        else if(srcPolicyPeriod.EMPWPCLineExists){
          gw.transaction.Transaction.runWithNewBundle(\b -> {
            var policyChange = new PolicyChange(b)
            policyChange.startJob(nextYearsPolicyPeriod.Policy, nextYearsPolicyPeriod.PeriodStart)
            var policyChangePeriod = policyChange.LatestPeriod
            LiableEarningsUtilities_ACC.copyEMPWPCLiableEarnings(srcPolicyPeriod.EMPWPCLine.EMPWPCCovs.first(), policyChangePeriod.EMPWPCLine.EMPWPCCovs.first())
            nz.co.acc.job.audit.AuditHelper_ACC.setActiveTermFlagFieldsAndIssuePolicy(srcPolicyPeriod, policyChangePeriod, true)
          })
        }
      }
    }
  }

  public static function checkAndTriggerProvisionalUpdate(policyPeriod:PolicyPeriod) {
    if(policyPeriod.Audit != null and policyPeriod.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE) {
      updateFollowingYearProvisionalsFromAudit(policyPeriod, policyPeriod.Audit)
    }
  }

}
