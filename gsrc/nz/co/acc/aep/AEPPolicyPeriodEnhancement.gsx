package nz.co.acc.aep

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.plugin.Plugins
uses gw.plugin.billing.IBillingSummaryPlugin
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.GosuStringUtil
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC

uses entity.Job

enhancement AEPPolicyPeriodEnhancement : PolicyPeriod {

  function rewritePolicy_ACC(
      toAccount : Account,
      effectiveDate : Date,
      applyPhantomPolicy : Boolean = null,
      testOverrideAEPPrimeACCNumber : String = null) : Job[] {

    validateAEPRewritePolicy_ACC(toAccount, effectiveDate)
    var jobList = new ArrayList<Job>()
    var cancellationPP = this
    var jobCancelReasonCode : ReasonCode = null

    if (not this.Canceled) {
      try {
        var job = new Cancellation()
        job.Source = CancellationSource.TC_CARRIER
        job.EarningsAdjustment_ACC = applyPhantomPolicy

        if (toAccount.AEPContractAccount_ACC) {
          job.CancelReasonCode = ReasonCode.TC_JOINEDAEPGROUP_ACC
          jobCancelReasonCode = job.CancelReasonCode
        } else {
          job.CancelReasonCode = ReasonCode.TC_REMOVEDFROMAEPGROUP_ACC
          jobCancelReasonCode = job.CancelReasonCode
        }

        if (this.PeriodStart.compareIgnoreTime(effectiveDate) >= 0) {
          job.CeasedTradingDate_ACC = this.PeriodStart
          job.startJob(this.Policy, this.PeriodStart, CalculationMethod.TC_FLAT)
        } else {
          job.CeasedTradingDate_ACC = effectiveDate
          job.startJob(this.Policy, effectiveDate, CalculationMethod.TC_PRORATA)
        }

        job.LatestPeriod.CancellationProcess.cancelImmediately()
        jobList.add(job)
        cancellationPP = job.LatestPeriod
      } catch (e : Exception) {
        StructuredLogger.CONFIG.error_ACC("rewritePolicy", e)
        throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Error.CancellationError"))
      }
    }
    try {
      var aepPrimeACCNumber : String = null
      var cancelledPolicyACCId : String = null

      if (jobCancelReasonCode == ReasonCode.TC_JOINEDAEPGROUP_ACC) {
        if (testOverrideAEPPrimeACCNumber == null) {
          // retrieve actual AEP Prime ACC Number from Billing Center
          var aepPP = toAccount.AEPMasterPolicy_ACC.getLatestBoundPeriodForLevyYear_ACC(cancellationPP.LevyYear_ACC)
          var aepPrimeValue = Plugins.get(IBillingSummaryPlugin).retrievePolicyBillingSummary(aepPP.PolicyNumber, aepPP.TermNumber)
          aepPrimeACCNumber = (aepPrimeValue as gw.plugin.billing.bc1000.BCPolicyBillingSummaryWrapper).AltBillingACCId

        } else {
          aepPrimeACCNumber = testOverrideAEPPrimeACCNumber
        }
        cancelledPolicyACCId = cancellationPP.Policy.Account.ACCID_ACC
      }

      RewriteNewAccount.startRewriteNewAccount(new PolicyPeriod[]{cancellationPP}, toAccount)
      var newPP = this.Policy.RewrittenToNewAccountDestination.Periods?.first()
      if (newPP != null) {
        // DE744 - Copy CU_Maintained_By_ACC from old policy to new
        newPP.Policy.CU_Maintained_By_ACC = this.Policy.CU_Maintained_By_ACC

        if (jobCancelReasonCode == ReasonCode.TC_JOINEDAEPGROUP_ACC) {
          // Set ValidForClaims on new period
          var isAEPPrime = cancelledPolicyACCId == aepPrimeACCNumber
          newPP.PolicyTerm.ValidForClaimsReg_ACC = isAEPPrime
          newPP.PolicyTerm.VFCOverrideDate_ACC = null
          newPP.PolicyTerm.VFCUpdatePending_ACC = false
        }

        // DE1846 - Set the active term
        newPP.PolicyTerm.ActiveTerm_ACC = this.PolicyTerm.ActiveTerm_ACC
        if (applyPhantomPolicy != null) {
          if (jobCancelReasonCode == ReasonCode.TC_JOINEDAEPGROUP_ACC) {
            newPP.NewAEPCustomer_ACC = applyPhantomPolicy
          }
        }

        if (jobCancelReasonCode == ReasonCode.TC_JOINEDAEPGROUP_ACC) {
          newPP.CeasedTradingDate_ACC = this.CeasedTradingDate_ACC
          newPP.PolicyTerm.CeasedTradingDate_ACC = this.CeasedTradingDate_ACC
          if (applyPhantomPolicy) {
            if (newPP.EMPWPCLineExists) {
              LiableEarningsUtilities_ACC.copyEMPWPCLiableEarnings(cancellationPP.BasedOn.EMPWPCLine.EMPWPCCovs.first(),
                  newPP.EMPWPCLine.EMPWPCCovs.first())
            } else if (newPP.CWPSLineExists) {
              LiableEarningsUtilities_ACC.copyCWPSPolicyShareholders(cancellationPP.BasedOn,
                  newPP)
            }
          }
        } else if (jobCancelReasonCode == ReasonCode.TC_REMOVEDFROMAEPGROUP_ACC) {
          newPP.NewAEPCustomer_ACC = false
          if (applyPhantomPolicy) {
            newPP.CeasedTradingDate_ACC = effectiveDate
            newPP.PolicyTerm.CeasedTradingDate_ACC = effectiveDate
            cancellationPP.PolicyTerm.CeasedTradingDate_ACC = effectiveDate
          } else {
            newPP.CeasedTradingDate_ACC = null
            newPP.PolicyTerm.CeasedTradingDate_ACC = null
            cancellationPP.PolicyTerm.CeasedTradingDate_ACC = null
          }
        }

        if (not newPP.Policy.Account.AEPContractAccount_ACC) {
          newPP.recalculateAEPAccountMemberPolicyLiableEarnings_ACC()
        }

        newPP.getPolicyTerm().setFieldValue("MostRecentTerm", true)
        newPP.JobProcess.requestQuote()
        newPP.onBeginIssueJob()
        newPP.RewriteNewAccount.TriggerReason_ACC = ReasonCode.TC_AEPMEMBERMANAGEMENT_ACC
        newPP.RewriteNewAccountProcess.rewriteNewAccount()
      }

      jobList.add(newPP.RewriteNewAccount)
    } catch (e : Exception) {
      StructuredLogger.CONFIG.error_ACC("rewritePolicy", e)
      throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Error.RewriteError"))
    }
    return jobList.toTypedArray()
  }

  property get OriginalAccountBeforeAEPAccount_ACC() : Account {
    var lastRewritePP = this
    while (lastRewritePP != null and not(lastRewritePP.Job typeis RewriteNewAccount) and lastRewritePP.BasedOn != null) {
      lastRewritePP = lastRewritePP.BasedOn
    }
    return lastRewritePP.BasedOn.Policy.Account
  }

  property get AEPRewriteEffectiveDate_ACC() : Date {
    if (this.CancellationDate != null) {
      return this.CancellationDate
    } else {
      return this.PeriodStart
    }
  }

  function validateAEPRewritePolicy_ACC(toAccount : Account, rewriteEffectiveDate : Date) {
    if (toAccount == null) {
      throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.ToAccountIsNull"))
    }
    if (toAccount.AEPContractAccount_ACC and toAccount.StatusOfAccount_ACC != StatusOfAccount_ACC.TC_ACTIVE) {
      throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.ToAccountIsNotActive"))
    }
    if (rewriteEffectiveDate == null) {
      throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.RewriteEffectiveDateIsNull"))
    }
    if (rewriteEffectiveDate.compareIgnoreTime((this.PeriodStart)) < 0) {
      throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.EffectiveDateBeforePeriodStartError"))
    }
    if (rewriteEffectiveDate.compareIgnoreTime((this.PeriodEnd)) > 0) {
      throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.EffectiveDateAfterPeriodEndError"))
    }
    if (toAccount.AEPContractAccount_ACC) {
      var masterPolicyPeriod = toAccount.AEPMasterPolicy_ACC?.getLatestBoundPeriodForLevyYear_ACC(this.LevyYear_ACC)
      if (masterPolicyPeriod == null) {
        throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.NoActiveAEPMasterPolicy"))
      }
      if (toAccount.AEPContractTerminationDate_ACC != null) {
        throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.AEPContractIsTerminatedOrBeingTerminated"))
      }
      if (rewriteEffectiveDate.compareIgnoreTime(masterPolicyPeriod.PeriodStart) < 0 or
          this.PeriodEnd.compareIgnoreTime(masterPolicyPeriod.PeriodEnd) > 0) {
        throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.EffectivePeriodNotFallWithinMasterPolicyEffectivePeriod"))
      }
      if (masterPolicyPeriod.PolicyTerm.AEPMidTermStartDate_ACC != null and
          rewriteEffectiveDate.compareIgnoreTime(masterPolicyPeriod.PolicyTerm.AEPMidTermStartDate_ACC) < 0) {
        throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.EffectiveDateMustBeOnOrAfterMidTermStartDate",
            masterPolicyPeriod.PolicyTerm.AEPMidTermStartDate_ACC.ShortFormat))
      }
    } else {
      if (this.Policy.Account.AEPContractTerminationDate_ACC != null and
          rewriteEffectiveDate.compareIgnoreTime(this.Policy.Account.AEPContractTerminationDate_ACC) > 0) {
        throw new DisplayableException(DisplayKey.get("Web.AEPRewritePolicy_ACC.Validation.EffectiveDateMustBeBeforeContractTerminationDate",
            this.Policy.Account.AEPContractTerminationDate_ACC.ShortFormat))
      }

    }
  }

  property get HasGapInAEPRewritePeriods_ACC() : boolean {
    // When a policy moved between AEP contract account and its own account, no gap is allowed.
    if (this.Job typeis RewriteNewAccount and
        (this.Policy.Account.AEPContractAccount_ACC or this.Policy.RewrittenToNewAccountSource.Account.AEPContractAccount_ACC)) {
      var cancellationDate = this.Policy.RewrittenToNewAccountSource?.getLatestBoundPeriodForLevyYear_ACC(this.LevyYear_ACC).CancellationDate
      if (this.PeriodStart != null and cancellationDate != null and
          this.PeriodStart?.compareIgnoreTime(cancellationDate) != 0) {
        return true
      }
    }
    return false
  }

  function recalculateAEPAccountMemberPolicyLiableEarnings_ACC() {
    if (this.EMPWPCLineExists) {
      var coverable = this.EMPWPCLine.EMPWPCCovs.first()
      coverable.calculateBICLiableEarnings()
      coverable.LiableEarningCov.recalculateEmbassyWorkersEarnings(true)
    } else if (this.CWPSLineExists) {
      for (shareholder in this.CWPSLine.PolicyShareholders) {
        shareholder.computeAllShareholderEarnings()
      }
    }
  }

  property get IsAEPMemberPolicy_ACC() : boolean {
    return this.Policy.IsAEPMemberPolicy_ACC
  }

  property get IsFullYearAEPMember() : boolean {
    return this.IsAEPMemberPolicy_ACC and this.PeriodEnd.Month == 4 and this.PeriodEnd.DayOfMonth == 1
  }

  property get IsAEPMasterPolicy_ACC() : boolean {
    return this.Policy.IsAEPMasterPolicy_ACC
  }

  property get AEPMasterPolicy_ACC() : Policy {
    return this.Policy.AEPMasterPolicy_ACC
  }

  function hasOtherOpenTransactionsOnPolicyTerm_ACC(): boolean {
    var otherOpenJobs = this.PolicyTerm.Periods.where(\p -> p.Active and p.ID != this.ID)
    return otherOpenJobs.HasElements
  }

  property get onHoldFromReassessment_ACC() : boolean {
    return this.PolicyTerm.HoldReassessment_ACC
  }

  function initAEPContractTermination_ACC(terminationDate : Date) {
    if (this.IsAEPMasterPolicy_ACC and
        this.Job typeis PolicyChange and
        this.PolicyTerm.canPerformAEPAction_ACC(AEPAction_ACC.TC_START_CONTRACT_TERMINATION)) {
      var message = this.validateAEPContractTerminationDate_ACC(terminationDate)
      if (message != null) {
        throw new DisplayableException(message)
      }
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        bundle.add(this.Policy.Account).AEPContractTerminationDate_ACC = terminationDate
        bundle.add(this.Job).AEPPhaseBeforeTerminate_ACC = this.PolicyTerm.AEPPhase_ACC
        bundle.add(this.PolicyTerm).AEPPhase_ACC = AEPPhase_ACC.TC_TERMINATING
      })
    }
  }

  function cancelAEPContractTermination_ACC() {
    if (this.IsAEPMasterPolicy_ACC and
        this.Job typeis PolicyChange and
        this.Job.AEPPhaseBeforeTerminate_ACC != null) {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        bundle.add(this.Policy.Account).AEPContractTerminationDate_ACC = null
        bundle.add(this.PolicyTerm).AEPPhase_ACC = this.Job.AEPPhaseBeforeTerminate_ACC
        bundle.add(this.Job).AEPPhaseBeforeTerminate_ACC = null
      })
    }
  }

  function completeAEPContractTermination_ACC() {
    if (this.IsAEPMasterPolicy_ACC and
        this.Job typeis PolicyChange and
        this.Job.AEPPhaseBeforeTerminate_ACC != null) {
      if (this.Policy.Account.getAEPActiveMemberPoliciesForLevyYear_ACC(this.LevyYear_ACC).HasElements) {
        throw new DisplayableException(DisplayKey.get("Web.AEP_ACC.Account.Validation.AEPAccountStillHasMemberPolicies"))
      }
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        bundle.add(this.PolicyTerm).AEPPhase_ACC = AEPPhase_ACC.TC_TERMINATED
      })
    }
  }

  function validateAEPContractTerminationDate_ACC(terminationDate : Date) : String {
    if (terminationDate == null) {
      return DisplayKey.get("Web.AEP_ACC.Policy.Validation.TerminationDateIsRequired")
    } else if (terminationDate.compareIgnoreTime(this.PeriodStart) < 0 or
        terminationDate.compareIgnoreTime(this.PeriodEnd) > 0) {
      return DisplayKey.get("Web.AEP_ACC.Policy.Validation.TerminationDateMustWithinPolicyPeriod")
    }
    return null
  }

  function validateAEPMidTermStartDate_ACC() : String {
    if (this.PolicyTerm.AEPMidTermStartDate_ACC == null)
      return null

    if (this.PolicyTerm.AEPMidTermStartDate_ACC.compareIgnoreTime(this.PeriodStart) <= 0)
      return DisplayKey.get("Web.AEPMidTermStartDate_ACC.Validation.MustBeAfterPeriodStart")

    if (this.PolicyTerm.AEPMidTermStartDate_ACC.compareIgnoreTime(this.PeriodEnd) >= 0)
      return DisplayKey.get("Web.AEPMidTermStartDate_ACC.Validation.MustBeBeforePeriodEnd")

    return null
  }

  function validatePOCAllowedOnAEPMasterOrMemberPolicyTerm_ACC() : String {
    if (not(this.IsAEPMasterPolicy_ACC or this.IsAEPMemberPolicy_ACC))
      return null
    var job = this.Job
    if (not(job typeis PolicyChange))
      return null
    var finalAuditOnTermExists = this.PolicyTerm.Periods.hasMatch(\p -> p.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE)
    if (!finalAuditOnTermExists)
      return null
    return DisplayKey.get("Web.PolicyChange.NoPOCAllowedOnAEPMasterOrMemberPolicyTermWithFinalAudit_ACC")
  }

  function getMemberAccount() : Account {
    return this?.Policy?.RewrittenToNewAccountSource?.Account
  }

  function getMemberAccountName() : String {
    return getMemberAccount()?.AccountHolderContact?.DisplayName
  }

  /**
   * For the specified date, returns AltBillingAccountNumber from the AEP master policy period entity,
   * OR fetches that value from Billing Center if it is null in the PC database.
   *
   * @param date Timestamp of when an incident occurred
   * @return Optional result. Empty if not found in PC or BC
   */
  function getAEPPrimeMemberAccountAtDate_ACC(date : Date) : Optional<Account> {
    final var LOG = StructuredLogger.CONFIG
    var aepMasterPolicy = this.AEPMasterPolicy_ACC
    if (aepMasterPolicy == null) {
      if (LOG.DebugEnabled) {
        LOG.debug("AEP Master policy not found at date ${date} for period ${this}")
      }
      return Optional.empty()
    }

    var aepMasterPolicyPeriod = aepMasterPolicy.findBoundOrAuditedPeriodForDate_ACC(date)

    if (aepMasterPolicyPeriod == null) {
      if (LOG.DebugEnabled) {
        LOG.debug("AEP Master has no bound/audited policy period at date ${date} for period ${this}")
      }
      return Optional.empty()
    }

    var altBillingAccountNumber = aepMasterPolicyPeriod.AltBillingAccountNumber_ACC

    if (altBillingAccountNumber == null) {
      var policyNumber = aepMasterPolicyPeriod.PolicyNumber
      if (LOG.DebugEnabled) {
        LOG.debug("AltBillingAccountNumber is null in Policy Center. Retrieving altBillingAccountNumber from "
            + "Billing Center using policyNumber=${policyNumber} from aepMasterPolicyPeriodID=${aepMasterPolicyPeriod.ID}...")
      }
      var aepMasterBillingSummary = Plugins.get(IBillingSummaryPlugin)
          .retrievePolicyBillingSummary(aepMasterPolicyPeriod.PolicyNumber, aepMasterPolicyPeriod.TermNumber)
      altBillingAccountNumber = (aepMasterBillingSummary as gw.plugin.billing.bc1000.BCPolicyBillingSummaryWrapper).AltBillingACCId
      if (altBillingAccountNumber == null) {
        if (LOG.DebugEnabled) {
          LOG.debug("AltBillingAccountNumber is null in Billing Center for period ${this}")
        }
      } else {
        if (LOG.DebugEnabled) {
          LOG.debug("Found altBillingAccountNumber ${altBillingAccountNumber} in Billing Center for period ${this}")
        }
      }
    } else {
      if (LOG.DebugEnabled) {
        LOG.debug("Found altBillingAccountNumber ${altBillingAccountNumber} in Policy Center for period ${this}")
      }
    }

    if (GosuStringUtil.isBlank(altBillingAccountNumber)) {
      return Optional.empty()
    } else {
      var account = Account.finder.findAccountByAccountNumber(altBillingAccountNumber)
      return Optional.ofNullable(account)
    }
  }

  function getMemberACCNumber() : String {
    return this?.Policy?.RewrittenToNewAccountSource?.Account?.ACCID_ACC
  }

}
