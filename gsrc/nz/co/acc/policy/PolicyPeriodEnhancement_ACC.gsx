package nz.co.acc.policy

uses entity.EMPWPCLine
uses entity.ProductModifier
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.job.JobProcess
uses gw.pl.persistence.core.Bundle
uses gw.plugin.messaging.BillingMessageTransport
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC
uses nz.co.acc.lob.util.ModifiersUtil_ACC
uses nz.co.acc.plm.util.ActivityUtil
uses typekey.Job
uses typekey.PolicyLine

uses java.math.BigDecimal

/**
 * Policy period enhancement
 */
enhancement PolicyPeriodEnhancement_ACC : entity.PolicyPeriod {

  property get NextTermHasBoundAudit_ACC() : boolean {
    var levyYear = this.LevyYear_ACC
    var latestPolicyPeriodForNextLevyYear = this.Policy.PolicyTermFinder_ACC.findPolicyTermForLevyYear(levyYear + 1)?.findLatestBoundOrAuditedPeriod_ACC()
    if(latestPolicyPeriodForNextLevyYear == null){
      return false
    }
    else {
      var completedAudit = latestPolicyPeriodForNextLevyYear.isAudited_ACC and not latestPolicyPeriodForNextLevyYear.isAuditReversal_ACC
      return completedAudit
    }
  }

  /**
   * Uses ACC ID and Levy Year to identify the PolicyPeriod
   */
  property get DisplayName_ACC() : String {
    var accID = this.ACCPolicyID_ACC ?: this.Policy.Account.ACCID_ACC
    return gw.api.locale.DisplayKey.get("EntityName_ACC.PolicyPeriod",
        accID ?: gw.api.locale.DisplayKey.get("EntityName.PolicyPeriod.PolicyNumber.Unassigned"),
        this.PeriodEnd == null ? gw.api.locale.DisplayKey.get("Java.Null") : this.PeriodEnd.YearOfDate)
  }

  /**
   * Is the policy being migrated?
   */
  property get Migrating_ACC() : boolean {
    return this.Job?.MigrationJob_ACC
  }

  property get CeasedTrading_ACC() : boolean {
    return this.CeasedTradingDate_ACC != null
  }

  property get PPERStatus_ACC() : ERStatus_ACC {

    if (ModifiersUtil_ACC.getSelectedExperienceRating(this) == null) {
      return TC_ER_MODIFIER_PENDING
    } else {
      if (this.Job.Subtype == typekey.Job.TC_AUDIT) {
        var nextYearsPolicyPeriod = getNextYearsLatestPolicyPeriod()
        if (this.CeasedTrading_ACC == false and
            this.Policy.isPDW(this) == false and

            (!{ReasonCode.TC_JOINEDAEPGROUP_ACC, ReasonCode.TC_REMOVEDFROMAEPGROUP_ACC}
                .contains(this.CancelReasonCode) and

                (nextYearsPolicyPeriod == null or
                    (nextYearsPolicyPeriod.IsAEPMemberPolicy_ACC == false and
                        nextYearsPolicyPeriod.PolicyTerm.ERStatus_ACC == ERStatus_ACC.TC_ER_MODIFIER_PENDING and
                        !nextYearsPolicyPeriod.Canceled)))) {

          return ERStatus_ACC.TC_NEXT_TERM_ER_MODIFIER_PENDING

        }
      }

      if (LiableEarningsUtilities_ACC.isLiableEarningsNotAllZero(this) == false) {
        return TC_LE_PENDING
      }
    }

    if (this.Status == PolicyPeriodStatus.TC_BOUND ||
        this.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE) {
      return TC_POSTED_TO_BC
    }

    return ERStatus_ACC.TC_READY_FOR_BC
  }

  function getNextYearsLatestPolicyPeriod() : PolicyPeriod {
    var latestPP = this.Policy.findLatestBoundOrAuditedPeriod(this.LevyYear_ACC + 1)

    if (latestPP.Canceled and this.Policy.RewrittenToNewAccountDestination != null) {
      var latestPolicy = this.Policy
      do {
        latestPolicy = latestPolicy.RewrittenToNewAccountDestination
      } while (latestPolicy.RewrittenToNewAccountDestination != null)
      return latestPolicy.findLatestBoundOrAuditedPeriod(this.LevyYear_ACC + 1)
    }

    return latestPP
  }


  property get MigrationDisableRating_ACC() : boolean {
    return this.Job.MigrationJobInfo_ACC?.DisableRating
  }

  /**
   * Retrieve the disable adjustment entity for this slice
   */
  property get DisableAdjustments_ACC() : MigrationDisableAdjustments_ACC {
    var migrationPolicyInfo = this.Policy.MigrationPolicyInfo_ACC
    var disableAdjustments = migrationPolicyInfo.DisableAdjustments
    var disableAdjustment = disableAdjustments.firstWhere(\da -> da.SliceDate == this.EditEffectiveDate)
    var disabled = false
    var effDate = this.EditEffectiveDate
    if (disableAdjustment == null and this.BasedOn.EditEffectiveDate != null) {
      var ea = disableAdjustments.firstWhere(\da -> da.SliceDate == this.BasedOn.EditEffectiveDate)
      if (ea != null) {
        disabled = ea.Disabled
      }
    }
    if (disableAdjustment == null) {
      disableAdjustment = new MigrationDisableAdjustments_ACC() {:SliceDate = effDate, :Disabled = disabled}
      migrationPolicyInfo.addToDisableAdjustments(disableAdjustment)
    }
    return disableAdjustment
  }

  function createACCPolicyID() {
    var suffix = ""
    if (this.INDCoPLineExists or this.INDCPXLineExists) {
      suffix = "S"
    } else if (this.EMPWPCLineExists) {
      suffix = "E"
    } else if (this.CWPSLineExists) {
      suffix = "D"
    }
    var account = this.Policy.Account.ACCID_ACC
    this.ACCPolicyID_ACC = account + suffix
  }

  /**
   * Evaluates for each policy line whether the components that make up the total LE are all $0.00
   *
   * @return
   */
  property get AllTotalLiableEarningsComponentsZero_ACC() : boolean {
    if (this.INDCoPLineExists) {
      if (!this.INDCPXLineExists) {
        return this.INDCoPLine.allTotalLiableEarningsComponentsZero_ACC()
      } else {
        return this.INDCPXLine.allTotalLiableEarningsComponentsZero_ACC()
      }
    } else if (this.EMPWPCLineExists) {
      return this.EMPWPCLine.allTotalLiableEarningsComponentsZero_ACC()
    } else if (this.CWPSLineExists) {
      return this.CWPSLine.allTotalLiableEarningsComponentsZero_ACC()
    }
    return false
  }

  /**
   * Toggle migration adjustments
   */
  function toggleDisableAdjustments_ACC() {
    var disableAdjustment = DisableAdjustments_ACC
    disableAdjustment.Disabled = not disableAdjustment.Disabled
  }

  function getSelectedDiscountAppliedModifier() : DiscountsAppliedSelection_ACC {
    if (hasSelectedModifier("WSD")) {
      return DiscountsAppliedSelection_ACC.TC_WSD
    } else if (hasSelectedModifier("WSMP")) {
      return DiscountsAppliedSelection_ACC.TC_WSMP
    }
    return null
  }

  function getSelectedExperienceRatingModifier() : ProductModifier {
    return this.EffectiveDatedFields.ProductModifiers.firstWhere(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme"))
  }

  function hasSelectedModifier(searchString : String) : boolean {
    var discountModifiers = this.EffectiveDatedFields.ProductModifiers.where(\elt -> elt.Pattern.CodeIdentifier.contains(searchString))
    for (modifier in discountModifiers) {
      if (modifier.BooleanModifier)
        return true
    }
    return false
  }

  function initializeProductModifiers() {
    for (modifiers in this.EffectiveDatedFields.ProductModifiers) {
      if (modifiers.StartEndDate == null) {
        modifiers.StartEndDate = new StartEndDates_ACC(this)
      }
    }
  }

  function updateModifiersBasedOnKeyword(searchString : String, exactMatch : boolean) {
    var discountAppliedModifiers = this.EffectiveDatedFields.ProductModifiers.where(\elt -> elt.Pattern.CodeIdentifier.contains(searchString) == exactMatch)
    for (modifier in discountAppliedModifiers) {
      modifier.BooleanModifier = false
    }
  }

  function onCeaseFlagUpdate(ceasedFlag : boolean) {
    if (!ceasedFlag) {
      this.CeasedTradingDate_ACC = null
      // ChrisA 05/10/2020 added INDCoPLineExists. Otherwise it's triggered for WCP with no CP
      if (this.INDCoPLineExists and !this.IsNewLERuleAppliedYear) {
        LiableEarningsUtilities_ACC.resetINDCoPLiableEarnings(this.INDCoPLine.INDCoPCovs.first().ActualLiableEarningsCov)
        checkForLEofFollowingYear()
      }
    } else {
      this.CeasedTradingDate_ACC = this.PeriodEnd
      if (!this.IsNewLERuleAppliedYear) {
        checkForLEofFollowingYear()
        this.PolicyTerm.ActiveTerm_ACC = true
        var nextYearsPolicyPeriod = this.Policy.CompletedPeriodsWithCost.where(\elt -> elt.LevyYear_ACC == this.LevyYear_ACC + 1).orderByDescending(\row -> row.CreateTime)
        if (this.INDCoPLineExists and !this.IsNewLERuleAppliedYear) {
          var actualEarnings = this.INDCoPLine.INDCoPCovs.first().ActualLiableEarningsCov
          if (nextYearsPolicyPeriod.size() > 0) {
            var earnings = nextYearsPolicyPeriod.first().INDCoPLine.INDCoPCovs.first().LiableEarningCov
            LiableEarningsUtilities_ACC.copyEarnings(earnings, actualEarnings)
          } else {
            LiableEarningsUtilities_ACC.resetINDCoPLiableEarnings(actualEarnings)
          }
        }
      }
    }

    updateCULiableEarnings(this)
  }

  function updateCULiableEarnings(policyPeriod : PolicyPeriod) {
    if (policyPeriod.INDCoPLineExists) {
      policyPeriod.INDCoPLine.INDCoPCovs.first().calculateBICLiableEarnings(true)
    }
  }

  function checkForLEofFollowingYear() {
    // Check only for CP policies and when the Ceased flag is checked.
    if (!(this.CeasedTrading_ACC))
      return

    var currentLevyYear = this.LevyYear_ACC
    var policyPeriods : PolicyPeriod[]
    if (IsUnceaseRule1) {
      policyPeriods = this.Policy.CompletedPeriodsWithCost.where(\elt -> elt.LevyYear_ACC == currentLevyYear + 1)
    } else {
      policyPeriods = this.Policy.CompletedPeriodsWithCost.where(\elt -> elt.LevyYear_ACC == currentLevyYear + 2)
    }

    if (policyPeriods.length > 0) {
      var followingYearLatestPP = policyPeriods.first().LatestPeriod
      if (followingYearLatestPP.INDCoPLineExists) {
        var totalLiableEarnings = BigDecimal.ZERO
        if (this.IsUnceaseRule1) {
          totalLiableEarnings = followingYearLatestPP?.INDCoPLine?.INDCoPCovs?.first()?.ActualLiableEarningsCov?.TotalLiableEarnings
        } else {
          totalLiableEarnings = followingYearLatestPP?.INDCoPLine?.INDCoPCovs?.first()?.LiableEarningCov?.TotalLiableEarnings
        }
        if (totalLiableEarnings != null and totalLiableEarnings != 0) {
          throw new DisplayableException(DisplayKey.get("Web.Policy.Cessation_ACC.CeasedNotAllowed"))
        }
      }
    }
  }

  function isCeasedDateInSameLevyYear() : boolean {
    var ceasedDate = this.CeasedTradingDate_ACC
    var periodStartAtMidnight = this.PeriodStart.trimToMidnight()
    var periodEndAtMidnight = this.PeriodEnd.trimToMidnight()
    if (ceasedDate.compareTo(periodStartAtMidnight) < 0 ||
        ceasedDate.compareTo(periodEndAtMidnight) > 0) {
      return false
    }
    return true
  }

  function isPreviousYearsPeriodCeased() : boolean {
    var previousLevyYear = this.LevyYear_ACC - 1
    return isLevyYearCeased(previousLevyYear)
  }

  function isLevyYearCeased(levyYear : int) : boolean {
    var policyPeriod = this.Policy.CompletedPeriodsWithCost.firstWhere(\elt -> elt.LevyYear_ACC == levyYear).LatestPeriod
    if (policyPeriod == null) {
      // search for previous policies not part of current policy
      var issuedPolicySummary = this.Policy.Account.IssuedPolicies.firstWhere(\issuedPolicy -> issuedPolicy.ProductCode == this.Policy.ProductCode and issuedPolicy.LevyYear_ACC == levyYear)
      if (issuedPolicySummary != null) {
        var issuedPolicy = issuedPolicySummary.fetchPolicyPeriod().Policy
        if (issuedPolicy != null) {
          policyPeriod = issuedPolicy.CompletedPeriodsWithCost.firstWhere(\pp -> pp.LevyYear_ACC == levyYear).LatestPeriod
        }
      }
    }
    if (policyPeriod != null and policyPeriod.PolicyTerm.CeasedTrading_ACC) {
      return true
    }
    return false
  }

  function onCeaseFlagChange_ACC(currentLevyYear : int) {
    var nextYearsPolicy = this.Policy.CompletedPeriodsWithCost.orderByDescending(\row -> row.CreateTime).firstWhere(\elt -> elt.LevyYear_ACC == currentLevyYear + 1)
    if (nextYearsPolicy != null) {
      if (this.CeasedTrading_ACC) {
        if (this.INDCoPLineExists and !this.IsNewLERuleAppliedYear) {
          performPolicyChangeOnCeasedINDCoPLinePolicies_ACC(nextYearsPolicy, null)
        }
      } else {
        if (this.INDCoPLineExists and !this.IsNewLERuleAppliedYear) {
          performPolicyChangeOnCeasedINDCoPLinePolicies_ACC(nextYearsPolicy, this?.INDCoPLine?.INDCoPCovs?.first()?.BasedOn?.ActualLiableEarningsCov)
        }
      }
    }

    if ((this.EMPWPCLineExists or this.CWPSLineExists) and this.Job.Subtype == TC_POLICYCHANGE) {
      performPolicyChangeSourceOnCeasedWPSWPCPolicies_ACC()
    }
  }

  property get finalAuditExists_ACC() : boolean {
    if (this.INDCoPLineExists or this.INDCPXLineExists) {
      return false
    }

    var audit = this.PolicyTerm.findLatestBoundOrAuditedPeriod_ACC().Audit

    if (audit != null and !audit.AuditInformation.IsReversal) {
      return true
    }
    return false
  }

  property get pendingAuditExists_ACC() : boolean {
    if (this.INDCoPLineExists or this.INDCPXLineExists) {
      return false
    }
    return this.Policy.OpenJobs.countWhere(\j -> j.SelectedVersion.Status != PolicyPeriodStatus.TC_BOUND
        and j.SelectedVersion.PeriodEnd.YearOfDate == this.PeriodEnd.YearOfDate and j.Subtype == typekey.Job.TC_AUDIT) >= 1
  }

  function cancelFutureRenewingCPXPolicyPeriods() {
    var fn = "cancelFutureRenewingCPXPolicyPeriods"
    // do not process renewing policy periods
    if (not(this.Job.Subtype == typekey.Job.TC_RENEWAL and this.Status == PolicyPeriodStatus.TC_RENEWING)) {
      // get future renewing CPX policy periods
      var renewingCPXPolicyPeriods = this.Policy.Periods.where(\pp -> pp.Status == PolicyPeriodStatus.TC_RENEWING
          and pp.Job.Subtype == typekey.Job.TC_RENEWAL and (pp.LevyYear_ACC - this.LevyYear_ACC) == 1)
      if (renewingCPXPolicyPeriods != null) {
        // remove CPX line using policy change
        for (pp in renewingCPXPolicyPeriods) {
          if (pp.INDCPXLineExists) {
            gw.transaction.Transaction.runWithNewBundle(\b -> {
              var renewalProcess = pp.RenewalProcess
              renewalProcess.ActiveRenewalWorkflow.invokeTrigger(TC_EDITPOLICY)
              var cpxLinePattern = pp.Policy.Product.LinePatterns.firstWhere(\p -> p.isAvailable(pp) && p.PolicyLineSubtype == TC_INDCPXLINE)
              pp.removeFromLines(pp.getLine(cpxLinePattern))
              renewalProcess.requestQuote()
              pp.RenewalProcess.pendingRenew()
              StructuredLogger.CONFIG.info("Removed CPX from future renewing policy period: ${pp.DisplayName}")
            }, "sys")
          }
        }
      }
    }
  }

  function unceasePolicyOnLevyYear_ACC(levyYear : int) {
    var levyYearPolicy = this.Policy.CompletedPeriodsWithCost.orderByDescending(\row -> row.CreateTime).firstWhere(\elt -> elt.LevyYear_ACC == levyYear)
    var nextYearPolicy = this.Policy.CompletedPeriodsWithCost.orderByDescending(\row -> row.CreateTime).firstWhere(\elt -> elt.LevyYear_ACC == levyYear + 1)
    if (levyYearPolicy != null) {
      if (this.INDCoPLineExists) {
        unceasePolicy_ACC(levyYearPolicy)
      }
    }
  }

  function unceasePolicy_ACC(policyPeriod : PolicyPeriod) {
    var bundle : Bundle

    gw.transaction.Transaction.runWithNewBundle(\b -> {
      bundle = b
    }, "sys")

    var fn = "unCeasePolicyChange"
    var policyChange : PolicyChange
    policyChange = new PolicyChange(bundle)
    var effDate = policyPeriod.PeriodStart
    policyChange.startJob(policyPeriod.Policy, effDate)

    // The period is new, so we can access the first element now - TODO check
    var newPeriod = policyChange.Periods[0]
    newPeriod.CeasedTradingDate_ACC = null
    newPeriod.PolicyTerm.CeasedTradingDate_ACC = null
    if (!newPeriod.IsNewLERuleAppliedYear) {
      LiableEarningsUtilities_ACC.resetINDCoPLiableEarnings(newPeriod.INDCoPLine.INDCoPCovs.first().ActualLiableEarningsCov)
    }
    updateCULiableEarnings(newPeriod)

    newPeriod.PolicyTerm.ActiveTerm_ACC = true
    newPeriod.PolicyChangeProcess.requestQuote()
    newPeriod.PolicyChangeProcess.issueJob(true)

    bundle.commit()

    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Policy Change success")
    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "JobNumber: ${policyChange.JobNumber}")
    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "PolicyNumber:  ${policyChange.Periods[0].PolicyNumber}")
    StructuredLogger.INTEGRATION.info(this + " " + fn + " " + "Unceasing policy period for ${newPeriod.LevyYear_ACC} using policy period: ${newPeriod.PublicID} ")
  }

  function onNewAEPCustomerFlagChanged_ACC(newAEPCustomer : boolean) {
    if (this.Policy.RewrittenToNewAccountSource != null and
        this.Policy.RewrittenToNewAccountDestination == null) {
      var policyNumber = this.Policy.RewrittenToNewAccountSource.Periods.first().PolicyNumber
      var policy = Policy.finder.findPolicyByPolicyNumber(policyNumber)

      var bundle : Bundle
      gw.transaction.Transaction.runWithNewBundle(\b -> {
        bundle = b
      }, "sys")

      var newPeriod : PolicyPeriod

      if (this.Job.Subtype == Job.TC_POLICYCHANGE) {

        var fn = "policyChange"
        var policyChange : PolicyChange
        policyChange = new PolicyChange(bundle)
        var effDate = policy.LatestBoundPeriod.PeriodStart
        policyChange.startJob(policy, effDate)

        // The period is new, so we can access the first element now - TODO check
        newPeriod = policyChange.Periods[0]
        newPeriod.NewAEPCustomer_ACC = newAEPCustomer

        if (newAEPCustomer == false) {
        }

        newPeriod.PolicyChangeProcess.requestQuote()
        newPeriod.PolicyChangeProcess.issueJob(true)

        bundle.commit()

        StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Policy Change success")
        StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "JobNumber: ${policyChange.JobNumber}")
        StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "PolicyNumber:  ${policyChange.Periods[0].PolicyNumber}")
      } else if (this.Job.Subtype == Job.TC_AUDIT) {
        var latestBoundPeriod = policy.LatestBoundPeriod
        newPeriod = latestBoundPeriod.Audit.revise()
        var auditJob = latestBoundPeriod.Audit
        var auditInformation = auditJob.AuditInformation

        auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
        auditInformation.ReceivedDate = Date.CurrentDate

        newPeriod.CeasedTradingDate_ACC = this.CeasedTradingDate_ACC

        var auditProcess = newPeriod.AuditProcess

        if (newPeriod.Policy.RewrittenToNewAccountSource == null) {
          auditProcess.requestQuote()
        }
        if (auditProcess.canComplete().Okay) {
          auditProcess.complete()
        }
      }
    }
  }

  function performPolicyChangeOnCeasedINDCoPLinePolicies_ACC(policyPeriod : PolicyPeriod, liableEarnings : INDLiableEarnings_ACC) {
    var bundle : Bundle

    gw.transaction.Transaction.runWithNewBundle(\b -> {
      bundle = b
    }, "sys")

    var fn = "policyChange"
    var policyChange : PolicyChange
    policyChange = new PolicyChange(bundle)
    var effDate = policyPeriod.PeriodStart
    policyChange.startJob(policyPeriod.Policy, effDate)

    // The period is new, so we can access the first element now - TODO check
    var newPeriod = policyChange.Periods[0]

    if (liableEarnings == null) {
      LiableEarningsUtilities_ACC.resetINDCoPLiableEarnings(newPeriod.INDCoPLine.INDCoPCovs.first().LiableEarningCov)
    } else {
      LiableEarningsUtilities_ACC.copyEarnings(liableEarnings, newPeriod.INDCoPLine.INDCoPCovs.first().LiableEarningCov)
      updateCULiableEarnings(newPeriod)
    }

    newPeriod.PolicyTerm.ActiveTerm_ACC = false
    newPeriod.PolicyChangeProcess.requestQuote()
    newPeriod.PolicyChangeProcess.issueJob(true)

    bundle.commit()

    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Policy Change success")
    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "JobNumber: ${policyChange.JobNumber}")
    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "PolicyNumber:  ${policyChange.Periods[0].PolicyNumber}")
  }

  function performPolicyChangeSourceOnCeasedWPSWPCPolicies_ACC() {
    var bundle : Bundle
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      bundle = b
    }, "sys")

    if (this.Canceled == false and this.Policy.RewrittenToNewAccountSource != null) {
      var policyNumber = this.Policy.RewrittenToNewAccountSource.Periods.first().PolicyNumber
      var latestBoundPeriod = Policy.finder.findPolicyByPolicyNumber(policyNumber).LatestBoundPeriod
      var policy = latestBoundPeriod.Policy
      var rewrittenDestination = policy.RewrittenToNewAccountDestination

      if (policy.RewrittenToNewAccountSource != null and (rewrittenDestination == null or
          (rewrittenDestination != null and rewrittenDestination.LatestBoundPeriod.Canceled == false))) {
        if (this.Job.Subtype == Job.TC_POLICYCHANGE) {
          var fn = "policyChange"
          var policyChange : PolicyChange
          policyChange = new PolicyChange(bundle)

          var effDate = latestBoundPeriod.PeriodStart
          policyChange.startJob(latestBoundPeriod.Policy, effDate)

          var newPP = policyChange.Periods[0]
          newPP.CeasedTradingDate_ACC = this.CeasedTradingDate_ACC

          if (newPP.IsAEPMasterPolicy_ACC == false) {
          }

          newPP.PolicyChangeProcess.requestQuote()
          newPP.PolicyChangeProcess.issueJob(true)

          bundle.commit()

          StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Policy Change success")
          StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "JobNumber: ${policyChange.JobNumber}")
          StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "PolicyNumber:  ${policyChange.Periods[0].PolicyNumber}")
        } else if (this.Job.Subtype == Job.TC_AUDIT) {
          var newPP = latestBoundPeriod.Audit.revise()
          var auditJob = latestBoundPeriod.Audit
          var auditInformation = auditJob.AuditInformation

          auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
          auditInformation.ReceivedDate = Date.CurrentDate

          newPP.CeasedTradingDate_ACC = this.CeasedTradingDate_ACC

          var auditProcess = newPP.AuditProcess

          if (newPP.Policy.RewrittenToNewAccountSource == null) {
            auditProcess.requestQuote()
          }
          if (auditProcess.canComplete().Okay) {
            auditProcess.complete()
          }
        }
      }
    }
  }

  /**
   * The OOTB method returns a map of AccountContacts to a list of Roles that Account Contact plays
   * on the policy period.  This enhancement is useful for generating the full list of Policy Contact Roles
   * on a PolicyPeriod, as well as any Audit periods, grouped by the AccountContact.
   */
  property get AccountContactRoleMap_ACC() : java.util.Map<AccountContact, java.util.List<PolicyContactRole>> {
    //TODO can be a bit expensive as we need to display all bound and final audited periods - business will re-evaulate, may need to modify the method signature to get the contact and do a query instead
    return this.Policy.Periods.where(\elt -> elt.Status == PolicyPeriodStatus.TC_BOUND or elt.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE)*.PolicyContactRoles.partition(\pcr -> pcr.AccountContactRole.AccountContact)
  }

  function resetAllCostOverrides_ACC() {
    var costs = this.AllCosts
    for (cost in costs) {
      cost.resetOverrides()
    }
  }

  /**
   * Recalculate the liable earnings for CP/WPC/WPS
   *
   * @param policyPeriod
   */
  public function recalculateLiableEarnings() {
    var internalJob = this.Job.InternalJob_ACC == null ? false : this.Job.InternalJob_ACC.booleanValue()
    if (this.INDCoPLineExists) {
      // Find the first coverable
      var coverable = this.INDCoPLine.INDCoPCovs.first()
      coverable.calculateBICLiableEarnings(true)
    } else if (this.EMPWPCLineExists) {
      // Find the first coverable
      var coverable = this.EMPWPCLine.EMPWPCCovs.first()
      coverable.calculateBICLiableEarnings()
      // Recalculate Embassy worker Earnings
      var isSubmission = this.Job typeis Submission
      var liableEarnings = coverable.getLiableEarnings()
      if (liableEarnings.EmbassyWorker_ACC && internalJob) {
        coverable.LiableEarningCov.recalculateEmbassyWorkersEarnings(isSubmission)
      }
    } else if (this.CWPSLineExists) {
      // update shareholder earnings
      var shareholders = this.CWPSLine.PolicyShareholders
      for (shareholder in shareholders) {
        shareholder.computeAllShareholderEarnings()
      }
    }
  }

  /**
   * @return true if cancellation date is same as period start
   */
  function isFullyCancelled() : boolean {
    return this.CancellationDate == this.PeriodStart
  }

  /**
   * @return true if the period has been cancelled to join aep
   */
  function hasJoinedAEP() : boolean {
    return this.Cancellation != null && this.Cancellation.CancelReasonCode == ReasonCode.TC_JOINEDAEPGROUP_ACC
  }

  /**
   * DE2458 - Used to determine if the policy period should be set back to draft
   * Return true if:
   * 1. The status is equal to Quoted AND
   * 2. It is an Audit job AND
   * 3. The policy term is on hold AND
   * 4. There is an audit on hold UW issue
   *
   * @return
   */
  function hasQuotedAuditOnHoldPreventReassessmentUWIssue_ACC() : boolean {
    return (this.Status == PolicyPeriodStatus.TC_QUOTED and this.Job typeis Audit and this.PolicyTerm.HoldReassessment_ACC
        and this?.UWIssuesIncludingSoftDeleted?.hasMatch(\uwIssue -> uwIssue.IssueKey == "AuditOnHoldPreventReassessment_ACC"))
  }

  /**
   * Returns value of ERAIndicator_ACC if this is a WPC policy period. Otherwise returns null
   *
   * @return
   */
  function getWpcEraIndicator_ACC() : Boolean {
    var firstLine = this.Lines.first()
    if (firstLine typeis EMPWPCLine) {
      return firstLine.EMPWPCCovs.first().LiableEarningCov.ERAIndicator_ACC
    } else {
      return null
    }
  }

  property get isBound_ACC() : boolean {
    return this.Status == PolicyPeriodStatus.TC_BOUND
  }

  property get isAudited_ACC() : boolean {
    return this.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE
  }

  property get isBoundOrAudited_ACC() : boolean {
    return this.isBound_ACC || this.isAudited_ACC
  }

  property get isAuditReversal_ACC() : Boolean {
    return this.isAudited_ACC and this.Audit.AuditInformation.RevisionType == RevisionType.TC_REVERSAL
  }

  property get isAuditRevision_ACC() : Boolean {
    return this.isAudited_ACC and this.Audit.AuditInformation.RevisionType == RevisionType.TC_REVISION
  }

  property get isPolicyChange_ACC() : Boolean {
    return this.isBound_ACC and this.Job.Subtype == typekey.Job.TC_POLICYCHANGE
  }

  property get isRenewal_ACC() : Boolean {
    return this.isBound_ACC and this.Job.Subtype == typekey.Job.TC_RENEWAL
  }

  property get isIssuance_ACC() : Boolean {
    return this.isBound_ACC and this.Job.Subtype == typekey.Job.TC_ISSUANCE
  }

  property get policyTransactionID() : String {
    return this.Job.JobNumber
  }

  function addEvent(billingEventType : BillingMessageTransport) {
  }

  property get IsBeforePostTransitionYear() : boolean {
    return this.LevyYear_ACC <= (ScriptParameters.SelfEmployedNewLEStartYear_ACC)
  }

  property get IsNewLERuleAppliedYear() : boolean {
    return this.LevyYear_ACC >= (ScriptParameters.SelfEmployedNewLEStartYear_ACC)
  }

  property get IsLETransitionYear() : boolean {
    return this.LevyYear_ACC == (ScriptParameters.SelfEmployedNewLEStartYear_ACC)
  }

  property get IsPostTransitionYear() : boolean {
    return this.LevyYear_ACC > (ScriptParameters.SelfEmployedNewLEStartYear_ACC)
  }

  property get IsBeforeTransitionYear() : boolean {
    return this.LevyYear_ACC < (ScriptParameters.SelfEmployedNewLEStartYear_ACC)
  }

  property get IsUnceaseRule1() : boolean {
    return this.LevyYear_ACC >= (ScriptParameters.SelfEmployedNewLEStartYear_ACC) - 1
  }

  property get IsUnceaseRule2() : boolean {
    return this.LevyYear_ACC < (ScriptParameters.SelfEmployedNewLEStartYear_ACC) - 1
  }

  property get IsWorkingSaferLevyApplied() : boolean {
    return this.LevyYear_ACC >= ScriptParameters.WorkingSaferStartLevyYear_ACC
  }

  property get CurrentJobProcess() : JobProcess {
    if (this.Job typeis PolicyChange) {
      return this.PolicyChangeProcess
    } else if (this.Job typeis Renewal) {
      return this.RenewalProcess
    } else if (this.Job typeis Audit) {
      return this.AuditProcess
    } else if (this.Job typeis Submission) {
      return this.SubmissionProcess
    }
    return null
  }

  /**
   * Returns the latest Alt Billing account number from BC for AEP policies,
   * else return period's Alt Billing account number.
   *
   * @return
   */
  property get AltBillingAccountNumber_ACC() : String {
    if (this.Policy.Account.AEPContractAccount_ACC and this.AEPLineExists) {
      // get previous period from BC to get the true alt billing account
      return this.calculateDefaultAltBillingAccountNumber(this.BillingMethod)
    } else {
      return this.AltBillingAccountNumber
    }
  }

  function clearCPXCancelFields() {
    this.CPXCancelTriggerReason = null
    this.CPXCancellationType_ACC = null
    this.CPXCancellationDate_ACC = null
    this.SendCPXLetter_ACC = false
  }

  function CPXShowVariationLetter() : boolean {
    if (this.Job typeis PolicyChange and this.Status == PolicyPeriodStatus.TC_DRAFT and this.INDCPXLineExists and this.BasedOn.INDCPXLineExists) {
      var bicCodes = this.INDCPXLine.BICCodes
      var bicChanged = bicCodes.hasMatch(\elt1 -> elt1.isFieldChangedFromBasedOn("CUCode"))
      var locChanged = this.INDCPXLine.INDCPXCovs.first().CPXInfoCovs.hasMatch(\elt1 -> elt1.isFieldChangedFromBasedOn("AgreedLevelOfCover"))
      var cpxPeriodChanged = !this.INDCPXLine.INDCPXCovs.first().CPXInfoCovs.hasMatch(\elt1 -> this.INDCPXLine.BasedOn.INDCPXCovs.first().CPXInfoCovs.hasMatch(\elt -> elt.PeriodStart == elt1.PeriodStart) and
          this.INDCPXLine.BasedOn.INDCPXCovs.first().CPXInfoCovs.hasMatch(\elt -> elt.PeriodEnd == elt1.PeriodEnd))
      return bicChanged or locChanged or cpxPeriodChanged
    }
    return false
  }

  function getSliceAtEffectiveDate_ACC() : PolicyPeriod {
    return this.getSlice(this.EditEffectiveDate)
  }

  property get JunoInfoServiceDisplayName_ACC() : String {
    return new StringBuilder(64)
        .append(this.ACCPolicyID_ACC)
        .append(':')
        .append(this.EditEffectiveDate.toISODate())
        .append(':')
        .append(this.PublicID)
        .append(':')
        .append(this.Job.Subtype.Code)
        .toString()
  }

  // ChrisA 13/10/2020 JUNO-382 stop users creating or submitting FA with Cease == no unless with permission - START
  public function canSetCeasedToNo() : boolean {
    // this logic seems to work backwards.  True if you don't want the message to show, false if you do
    var info = this.Audit.AuditInformation
    if (info != null) {
      if (this.Job.Subtype == Job.TC_AUDIT and (!info.IsReversal and !info.IsRevision)) {
        // this is a final audit only
        if (perm.System.submitManualFinalAuditNoCeaseDate_acc) {
          // setting Ceased to Yes or No for a permissioned user is ok
          return false
        } else if (this.CeasedTrading_ACC) {
          // setting yes is no problem for any user
          return true
        }
      }
    }
    // for the non-permissioned user when selecting no and for all other policy types
    return false
  }

  public function allowFinalAuditSubmit() : boolean {
    return enableFinalAuditNext()
  }

  public function enableFinalAuditNext() : boolean {
    var info = this.Audit.AuditInformation
    if (info != null and this.Job.Subtype == Job.TC_AUDIT)  {
      if ((info.IsReversal or info.IsRevision) or
          (perm.System.submitManualFinalAuditNoCeaseDate_acc or
              this.CeasedTrading_ACC)) {
        // reversal or revision
        // if DFA UW issue is rejected, user shouldn't be allowed to submit a final audit.
        var isBlockingDFAUWIssue = this.UWIssuesActiveOnly.hasMatch(\issue -> ActivityUtil.isDFAUWIssue_ACC(issue) and (issue.Rejected or issue.Approval == null))
        return isBlockingDFAUWIssue ? false : true
      }
      // Ceased is no and use doesn't have permission to submit a Final Audit
      return false
    }
    return true
  }
  // ChrisA 13/10/2020 JUNO-382 stop users creating or submitting FA with Cease == no unless with permission - FINISH

  property get LatestPolicy() : Policy {
    return Query.make(Policy).compare(Policy#ID, Relop.Equals, this.Policy.ID).select().first()
  }

  property get RenewPolicyOnActiveStatus() : Boolean {
    if (ScriptParameters.RenewOnActiveStatus_ACC) {
      if (ScriptParameters.CheckVFCOnPolicyRenewal_ACC and this.PolicyTerm.ValidForClaimsReg_ACC) {
        StructuredLogger_ACC.CONFIG.info("CheckVFCOnPolicyRenewal_ACC ${this.PolicyTerm.ValidForClaimsReg_ACC} Renewal triggered")
        return true
      } else if (this.IsAEPMemberPolicy_ACC or this.IsAEPMasterPolicy_ACC) {
        StructuredLogger_ACC.CONFIG.info("AEP Renewal triggered")
        return true
      } else if (this.Lines.hasMatch(\elt1 -> elt1.Subtype == PolicyLine.TC_INDCPXLINE)) {
        StructuredLogger_ACC.CONFIG.info("INDCPXLINE Renewal triggered")
        return true
      } else if (this.Job.TriggerReason_ACC == ReasonCode.TC_IR_ACC) {
        StructuredLogger_ACC.CONFIG.info("IR_ACC Renewal triggered")
        return true
      }
      StructuredLogger_ACC.CONFIG.info("IsActiveAndHasReason_ACC Policy Status ${this.Policy.Status_ACC.Name} Reason ${this.Policy.ActiveReason_ACC.Name} Renewal triggered")
      return this.Policy.IsActiveAndHasReason_ACC
    }
    return true
  }

  function unlock_ACC() {
    PolicyPeriod#Locked.set(this, false)
  }

  property get CanRenewPolicy() : boolean {
    return perm.PolicyPeriod.renew(this) and this.RenewPolicyOnActiveStatus and this.Policy.canStartRenewal() == null
  }

  property get IsPolicyPeriodLevyYearHistoric_ACC() : boolean {
    var historicDebitOffset_ACC = ScriptParameters.HistoricDebitOffset_ACC
    var currentSystemLevyYear = DateUtil_ACC.nextACCLevyYearStart(Date.Today.trimToMidnight()).YearOfDate
    var historicDebitStartLevyYear = currentSystemLevyYear + historicDebitOffset_ACC - 1 // offset (4 years) including the current year so -1 required.
    return this.LevyYear_ACC <= historicDebitStartLevyYear
  }

  property get TotalAmountExclGST_ACC() : BigDecimal {
    return this.AllCosts
        .where(\cost -> cost.ChargePattern != ChargePattern.TC_GST)
        .sum(\cost -> cost.ActualAmount_amt) ?: BigDecimal.ZERO
  }

  property get TotalAmountInclGST_ACC() : BigDecimal {
    return this.AllCosts.sum(\cost -> cost.ActualAmount_amt ?: BigDecimal.ZERO) ?: BigDecimal.ZERO
  }

  function hasModifierApplied() : Boolean {
    if (this.EMPWPCLineExists) {
      return this.EMPWPCLine.getSelectedExperienceRatingModifier().TypeKeyModifier != null
    } else if (this.CWPSLineExists) {
      return this.CWPSLine.getSelectedExperienceRatingModifier().TypeKeyModifier != null
    } else if (this.INDCoPLineExists) {
      return this.getSelectedExperienceRatingModifier().TypeKeyModifier != null
    }
    return false
  }

  function getPolicyLineBICCodes() : PolicyLineBusinessClassificationUnit_ACC[] {
    if (this.EMPWPCLineExists) {
      return this.EMPWPCLine.BICCodes
    } else if(this.CWPSLineExists) {
      return this.CWPSLine.BICCodes
    } else if(this.INDCoPLineExists) {
      return this.INDCoPLine.BICCodes
    }
    return null
  }
}
