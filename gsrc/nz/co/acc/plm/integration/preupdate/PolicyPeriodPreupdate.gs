package nz.co.acc.plm.integration.preupdate

uses gw.api.locale.DisplayKey
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.aep.AEPPolicyPeriodPreupdateImpl
uses nz.co.acc.integration.instruction.helper.InstructionRecordUtil
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC
uses nz.co.acc.lob.util.ProRationUtil_ACC
uses nz.co.acc.plm.integration.files.outbound.RecordCaptureActionFactory
uses nz.co.acc.plm.integration.instruction.builder.CPXUpdatesWPSWorkerBuilder
uses nz.co.acc.plm.util.ActivityUtil
uses nz.co.acc.plm.workflow.CPXNewSubmissionLetterEnhancement
uses nz.co.acc.policy.PolicyStatusHandler_ACC
uses nz.co.acc.util.finder.FinderUtil_ACC
uses nz.co.acc.gwer.util.ERProcessUtils_ACC
uses typekey.Job

uses java.lang.invoke.MethodHandles
uses java.math.BigDecimal

class PolicyPeriodPreupdate {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  public static function executePreUpdate(entity : PolicyPeriod) {
    if (entity.Job != null) {
      updateLevyYear(entity)
      cpxSubmission(entity)
      recalculateLiableEarnings(entity)
      activeTerm(entity)
      updateOnCease(entity)
      calculateProRataFactor(entity)
      ceaseFlagUpdates(entity)
      updateERStatus_ACC(entity)
      updateBICCUCodes(entity)
      triggerCPXUpdatesWPSInstruction(entity)
      updateBICCUCodesRenewals(entity)
      setCUMaintainedByACCIfManualBICCodeChange(entity)
      PolicyStatusHandler_ACC.executePreupdate(entity)
      cpxCancellation(entity)
      cpxRenewal(entity)
      cpxVariation(entity)
      cancelCPXNewSubmissionLetter(entity)
      updateModifierFlag(entity)
      triggerRecalc(entity)
      updateERFlags(entity)
    }
    AEPPolicyPeriodPreupdateImpl.Instance.executePreUpdate(entity)
  }

  private static function updateModifierFlag(pp : PolicyPeriod) {
    var policyTerm = pp.PolicyTerm
    if ((pp.Status == PolicyPeriodStatus.TC_RENEWING or pp.Status == PolicyPeriodStatus.TC_BOUND)
        and !policyTerm.ModifierApplied_ACC
        and pp.LevyYear_ACC >= DateUtil_ACC.currentLevyYear()) {
      policyTerm.ModifierApplied_ACC = pp.hasModifierApplied()
    }
  }

  private static function triggerRecalc(_branch : PolicyPeriod) {
    if (_branch.Job.TriggerReason_ACC == ReasonCode.TC_IR_ACC and
        _branch.EMPWPCLineExists and
        _branch.Job.Subtype == typekey.Job.TC_RENEWAL and
        _branch.Status == PolicyPeriodStatus.TC_BOUND and
        DateUtil_ACC.currentLevyYear() == _branch.LevyYear_ACC) {
      _branch.PolicyTerm.ERRecalcRequired_ACC = true
    }
  }

  private static function updateERFlags(entity : PolicyPeriod) {
    if(entity.Status == PolicyPeriodStatus.TC_BOUND or entity.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE) {
      var policyTerm = entity.PolicyTerm
      policyTerm.HasLEorLevies_ACC = new ERProcessUtils_ACC().HasLEorLevies(entity)
      policyTerm.LatestBranchID_ACC = entity.ID.Value
      if(!policyTerm.ACCPolicyID_ACC.HasContent) {
        policyTerm.ACCPolicyID_ACC = entity.ACCPolicyID_ACC
      }

      if(policyTerm.LevyYear_ACC == null) {
        policyTerm.LevyYear_ACC = entity.LevyYear_ACC
      }

      if(entity.CancellationDate != null) {
        policyTerm.Cancelled_ACC = true
      } else {
        policyTerm.Cancelled_ACC = false
      }
    }
  }

  private static function ceaseFlagUpdates(policyPeriod : PolicyPeriod) {
    if (policyPeriod.New) {
      policyPeriod.CeasedTradingDate_ACC = policyPeriod.PolicyTerm.CeasedTradingDate_ACC
    } else if (policyPeriod.isFieldChanged(PolicyPeriod#Status) and policyPeriod.BasedOn?.CeasedTradingDate_ACC != policyPeriod.CeasedTradingDate_ACC
        and policyPeriod.isBoundOrAudited_ACC) {
      policyPeriod.PolicyTerm.CeasedTradingDate_ACC = policyPeriod.CeasedTradingDate_ACC
    }
  }

  /*
  * This function should be triggered for Policy Change and Policy Renewal and Audit
   */
  private static function updateBICCUCodes(polPeriod : PolicyPeriod) {
    if ((polPeriod.Job.Subtype == typekey.Job.TC_POLICYCHANGE or polPeriod.Job.Subtype == typekey.Job.TC_RENEWAL or polPeriod.Job.Subtype == typekey.Job.TC_AUDIT)
        and not(polPeriod.Status == PolicyPeriodStatus.TC_QUOTED or polPeriod.Status == PolicyPeriodStatus.TC_BOUND)) {
      var defaultCUApplied = false
      if (polPeriod.EMPWPCLineExists) {
        defaultCUApplied = LiableEarningsUtilities_ACC.setCUCode(polPeriod.EMPWPCLine.BICCodes, polPeriod.PeriodStart, polPeriod.PeriodEnd)
      } else if (polPeriod.CWPSLineExists) {
        defaultCUApplied = LiableEarningsUtilities_ACC.setCUCode(polPeriod.CWPSLine.BICCodes, polPeriod.PeriodStart, polPeriod.PeriodEnd)
      } else if (polPeriod.INDCPXLineExists) {
        //Updating the CP and CPX BIC's
        var flag1 = LiableEarningsUtilities_ACC.setCUCode(polPeriod.INDCoPLine.BICCodes, polPeriod.PeriodStart, polPeriod.PeriodEnd)
        var flag2 = LiableEarningsUtilities_ACC.setCUCode(polPeriod.INDCPXLine.BICCodes, polPeriod.PeriodStart, polPeriod.PeriodEnd)
        defaultCUApplied = (flag1 or flag2)
      } else if (polPeriod.INDCoPLineExists) {
        defaultCUApplied = LiableEarningsUtilities_ACC.setCUCode(polPeriod.INDCoPLine.BICCodes, polPeriod.PeriodStart, polPeriod.PeriodEnd)
      }
      if (defaultCUApplied) {
        ActivityUtil.createCUReviewActivity(polPeriod.Policy.Account)
      }
    }
  }

  /*
  * This function must be triggered for Policy Renewal
  *
  * This function ensures that the previous years final audit CU is applied to the renewal.
  *
  * Default OOTB behaviour is to apply the previous year provisional CU to the renewal,
  * but this may be different to the previous year final audit CU.
  *
  */
  private static function updateBICCUCodesRenewals(entity : PolicyPeriod) {
    if (entity.Job.Subtype == typekey.Job.TC_RENEWAL
        and entity.isFieldChanged(PolicyPeriod#Status)
        and entity.Status == PolicyPeriodStatus.TC_BOUND) {

      // We don't update AEP master policies
      if (entity.IsAEPMasterPolicy_ACC) {
        return
      }

      var basedOnLine = entity.BasedOn.Lines[0]

      // We don't update multi CU policies
      if (basedOnLine.BICCodes.Count > 1) {
        return
      }

      var baseCode = basedOnLine.BICCodes[0]
      var latestPrevTerm = FinderUtil_ACC.findLatestBoundOrAuditedPeriod(entity.BasedOn.PolicyTerm)
      var latestBICCodes = latestPrevTerm.Lines[0].BICCodes

      // We don't update multi CU policies
      if (latestBICCodes.Count > 1) {
        return
      }

      var latestCode = latestBICCodes[0]

      // Migrated policies don't have BIC Codes.
      // If the CU changes on a migrated policy, then a BIC code will be there (can't just change the CU alone).
      if (baseCode.BICCode == null && latestCode.BICCode == null) {
        return
      }

      if (baseCode.BICCode != latestCode.BICCode) {
        // Create Bulk CU Change Instruction
        var record = new InstructionRecordUtil()
            .createCUChangeInstructionRecordEntity(
                entity.Bundle,
                entity.Policy.Account.ACCID_ACC,
                entity.Policy.ProductCode,
                entity.LevyYear_ACC,
                latestCode.BICCode,
                InstructionSource_ACC.TC_RENEWAL)
        _log.info("Renewal needs BICCode update. baseCode=${baseCode.BICCode}, latestCode=${latestCode.BICCode}. Created ${record}")
      }
    }
  }

  /**
   * Recalculate the liable earnings for CP/WPC/WPS when quoting only for internal jobs
   *
   * @param policyPeriod
   */
  private static function recalculateLiableEarnings(policyPeriod : PolicyPeriod) {
    if (policyPeriod.Status == PolicyPeriodStatus.TC_QUOTING) {
      policyPeriod.recalculateLiableEarnings()
    }
  }

  private static function updateERStatus_ACC(policyPeriod : PolicyPeriod) {
    if (policyPeriod.Policy.ProductCode.equals("AccreditedEmployersProgramme") == false) {
      if (policyPeriod.isFieldChanged(PolicyPeriod#Status)) {
        if (policyPeriod.isBoundOrAudited_ACC) {
          policyPeriod.PolicyTerm.ERStatus_ACC = policyPeriod.PPERStatus_ACC
        }
      }
    }
  }

  // DE472 set active term
  private static function activeTerm(policyPeriod : PolicyPeriod) {
    if (policyPeriod.Job typeis Submission and policyPeriod.isBoundOrAudited_ACC) {
      if (!policyPeriod.AllTotalLiableEarningsComponentsZero_ACC) {
        policyPeriod.PolicyTerm.ActiveTerm_ACC = true
      } else {
        policyPeriod.PolicyTerm.ActiveTerm_ACC = false
      }
    }
    if (policyPeriod.Job typeis PolicyChange and policyPeriod.isBoundOrAudited_ACC) {
      var currentActiveTerm = policyPeriod.PolicyTerm.ActiveTerm_ACC
      if (!currentActiveTerm and policyPeriod.AllTotalLiableEarningsComponentsZero_ACC) {
        policyPeriod.PolicyTerm.ActiveTerm_ACC = false
      } else {
        policyPeriod.PolicyTerm.ActiveTerm_ACC = true
      }
    }
    // DE1578 - Set Active Term for Audit
    if (policyPeriod.Job typeis Audit and policyPeriod.isBoundOrAudited_ACC) {
      var currentActiveTerm = policyPeriod.PolicyTerm.ActiveTerm_ACC
      if (!currentActiveTerm and policyPeriod.AllTotalLiableEarningsComponentsZero_ACC) {
        policyPeriod.PolicyTerm.ActiveTerm_ACC = false
      } else {
        policyPeriod.PolicyTerm.ActiveTerm_ACC = true
      }
    }
  }

  private static function updateOnCease(policyPeriod : PolicyPeriod) {
    if (policyPeriod.isFieldChanged(PolicyPeriod#CeasedTradingDate_ACC) and
        policyPeriod.Job typeis PolicyChange and
        policyPeriod.isBoundOrAudited_ACC and
        policyPeriod.BasedOn.CeasedTrading_ACC != policyPeriod.CeasedTrading_ACC) {
      policyPeriod.PolicyTerm.ActiveTerm_ACC = true
    }
  }

  private static function calculateProRataFactor(policyPeriod : PolicyPeriod) {
    if (policyPeriod.Status == PolicyPeriodStatus.TC_QUOTING) {
      var cpProRataFactor = BigDecimal.ONE
      if (policyPeriod.INDCPXLineExists) {
        for (cpxEarnings in policyPeriod.INDCPXLine.INDCPXCovs.first().CPXInfoCovs) {
          cpxEarnings.ProRataFactor = ProRationUtil_ACC.calculateProRateFactor(cpxEarnings.PeriodStart, cpxEarnings.PeriodEnd, policyPeriod.PeriodStart, policyPeriod.PeriodEnd, policyPeriod.PeriodEnd)
          cpProRataFactor -= cpxEarnings.ProRataFactor
        }
      }

      if (policyPeriod.INDCoPLineExists) {
        policyPeriod.INDCoPLine.INDCoPCovs.first().ProRataFactor = cpProRataFactor
      }

      if (policyPeriod.isFieldChanged(PolicyPeriod#CeasedTradingDate_ACC) and
          policyPeriod.Job typeis PolicyChange and
          policyPeriod.isBoundOrAudited_ACC and
          policyPeriod.BasedOn.CeasedTrading_ACC != policyPeriod.CeasedTrading_ACC) {
        policyPeriod.PolicyTerm.ActiveTerm_ACC = true
      }
    }
  }

  /**
   * The rules for Policy period -- CPX renewal trigger
   *
   * @param entity
   */
  private static function cpxRenewal(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job

    if ((policyPeriod.PolicyTerm.CPXRenewalLetterSent_ACC == null) and
        (job typeis Renewal) and
        policyPeriod.isFieldChanged(PolicyPeriod#Status) and
        (policyPeriod.Status == PolicyPeriodStatus.TC_RENEWING)
        and policyPeriod.INDCPXLineExists) {
      _log.info("Generating CPX Renewal letter for policy with PolicyNumber=" + policyPeriod.PolicyNumber)
      var bundle = policyPeriod.getBundle()
      var captureAction = RecordCaptureActionFactory.getRecordCaptureAction(OutBoundRecordType_ACC.TC_CPX_RENEWAL, bundle)
      captureAction.captureFull(policyPeriod)
      policyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_CPXLETTERS_ACC, \-> DisplayKey.get("Web.Admin.CPXLetters.WorkFlow.RenewalLetter"))
      policyPeriod.PolicyTerm.CPXRenewalLetterSent_ACC = true
    }
  }

  /**
   * The rules for Policy period -- CPX renewal trigger
   *
   * @param entity
   */
  private static function cpxVariation(policyPeriod : PolicyPeriod) {
    if (policyPeriod.New) {
      policyPeriod.SendCPXVariationLetter_ACC = false
    }

    if (policyPeriod.Status == PolicyPeriodStatus.TC_BOUND and policyPeriod.SendCPXVariationLetter_ACC) {
      _log.info("Generating CPX Variation letter for policy with PolicyNumber=" + policyPeriod.PolicyNumber)
      var bundle = policyPeriod.getBundle()
      var captureAction = RecordCaptureActionFactory.getRecordCaptureAction(OutBoundRecordType_ACC.TC_CPX_VARIATION, bundle)
      captureAction.captureFull(policyPeriod)
      policyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_CPXLETTERS_ACC, \-> DisplayKey.get("Web.Admin.CPXLetters.WorkFlow.VariationLetter"))
    }
  }

  /**
   * The rules for Policy period -- CPX submission trigger
   *
   * @param entity
   */
  private static function cpxSubmission(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job
    var createActivity = false

    if ((job typeis Submission || job typeis PolicyChange || job typeis Renewal)
        && policyPeriod.Status == PolicyPeriodStatus.TC_QUOTED
        && policyPeriod.INDCPXLineExists) {
      if (job typeis PolicyChange) {
        var latestBoundPeriod = policyPeriod.Policy.LatestBoundPeriod
        createActivity = hasCPXEffectiveDateTableChanged(latestBoundPeriod, policyPeriod)
      } else if (job typeis Renewal) {
        // DE2540 create activity for renewals if CP -> CPX
        if (!policyPeriod.BasedOn.INDCPXLineExists) {
          createActivity = true
        }
      } else {
        createActivity = true
      }
    }
    if (createActivity) {
      // If this is a IR file then do not create letters
      // Do not create CPX letter activity for acc portal requests
      // or cancellation via CPXCancellationAPI
      var user = User.util.getCurrentUser()
      var userName = user != null ? user.Credential.UserName : ""
      if (!(job.UpdateUser.Credential.UserName == "sys")
          and userName != "accportaluser"
          and userName != "acccoreintuser") {
        ActivityUtil.cpxLetterSubmission(job)
      }
    }
  }

  /**
   * The rules for Policy period -- CPX letters
   *
   * @param entity
   */
  private static function cancelCPXNewSubmissionLetter(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job
    if (job?.AllActivities?.hasMatch(\act -> act.ActivityPattern.Code == ActivityUtil.ACTIVITY_CODE_SEND_CPX_LETTER)) {
      if (policyPeriod.isFieldChanged(PolicyPeriod#Status) && (policyPeriod.Status == PolicyPeriodStatus.TC_BOUND or policyPeriod.Status == PolicyPeriodStatus.TC_WITHDRAWN)
          && policyPeriod.INDCPXLineExists) {
        CPXNewSubmissionLetterEnhancement.stopCPXNewSubmissionLetterWorkflow(policyPeriod, policyPeriod.Bundle)
      }
    }
  }


  private static function hasCPXEffectiveDateTableChanged(latestBoundPeriod : PolicyPeriod, policyPeriod : PolicyPeriod) : boolean {
    // The latest bound period was not a CPX Policy so the CPX Effective Date Table must have changed
    if (!latestBoundPeriod.INDCPXLineExists) {
      return true
    }
    var latestBoundPeriodCPXInfoCovs = latestBoundPeriod.INDCPXLine.INDCPXCovs.first().CPXInfoCovs
    var policyPeriodCPXInfoCovs = policyPeriod.INDCPXLine.INDCPXCovs.first().CPXInfoCovs
    if (latestBoundPeriodCPXInfoCovs == null and policyPeriodCPXInfoCovs == null) {
      return false
    }
    if ((latestBoundPeriodCPXInfoCovs == null and policyPeriodCPXInfoCovs != null)
        or (latestBoundPeriodCPXInfoCovs != null and policyPeriodCPXInfoCovs == null)
        or (latestBoundPeriodCPXInfoCovs.length != policyPeriodCPXInfoCovs.length)) {
      return true
    }
    var latestBoundPeriodCPXInfoCovsList = latestBoundPeriodCPXInfoCovs.toList()
    var policyPeriodCPXInfoCovsList = policyPeriodCPXInfoCovs.toList()
    // Sort by create time
    Collections.sort(latestBoundPeriodCPXInfoCovsList, new CPXInfoCovCreateTimeComparator())
    Collections.sort(policyPeriodCPXInfoCovsList, new CPXInfoCovCreateTimeComparator())
    var cpxEffectiveDateTableSame = true
    for (latestBoundPeriodCPXInfoCov in latestBoundPeriodCPXInfoCovsList index i) {
      if (!cpxInfoCovEquals(latestBoundPeriodCPXInfoCovsList.get(i), policyPeriodCPXInfoCovsList.get(i))) {
        cpxEffectiveDateTableSame = false
      }
    }
    return !cpxEffectiveDateTableSame
  }

  private static function cpxInfoCovEquals(latestBoundPeriodCPXInfoCov : CPXInfoCov_ACC, policyPeriodCPXInfoCov : CPXInfoCov_ACC) : boolean {
    return latestBoundPeriodCPXInfoCov.PeriodStart == policyPeriodCPXInfoCov.PeriodStart
        and latestBoundPeriodCPXInfoCov.PeriodEnd == policyPeriodCPXInfoCov.PeriodEnd
        and latestBoundPeriodCPXInfoCov.CoverTypeStandard == policyPeriodCPXInfoCov.CoverTypeStandard
        and latestBoundPeriodCPXInfoCov.AgreedLevelOfCover == policyPeriodCPXInfoCov.AgreedLevelOfCover
  }

  private static class CPXInfoCovCreateTimeComparator implements Comparator<CPXInfoCov_ACC> {

    override function compare(cpxInfoCov1 : CPXInfoCov_ACC, cpxInfoCov2 : CPXInfoCov_ACC) : int {
      var cpxInfoCovCreateTime1 = cpxInfoCov1.CreateTime
      var cpxInfoCovCreateTime2 = cpxInfoCov2.CreateTime
      return cpxInfoCovCreateTime1.compareTo(cpxInfoCovCreateTime2)
    }
  }

  /**
   * The rules for Policy period -- CPX cancellation trigger
   *
   * @param entity
   */
  private static function cpxCancellation(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job
    var sendLetter = false

    if (policyPeriod.New) {
      policyPeriod.clearCPXCancelFields()
    }

    if (job typeis PolicyChange) {
      if (job.TriggerReason_ACC == ReasonCode.TC_CANCELDELINQUENTCPX_ACC and policyPeriod.Status == PolicyPeriodStatus.TC_BOUND) {
        var policyTerm = policyPeriod.PolicyTerm

        var lastBound = policyTerm.Periods.orderByDescending(\p -> p.CreateTime).firstWhere(\p -> p.Status == PolicyPeriodStatus.TC_BOUND && p != policyPeriod)

        if (lastBound?.INDCPXLineExists) {
          sendLetter = true
        }
      } else if (policyPeriod.SendCPXLetter_ACC && policyPeriod.Status == PolicyPeriodStatus.TC_BOUND) {
        sendLetter = true
      }
    } else if (job typeis Renewal) {
      if (policyPeriod.SendCPXLetter_ACC and policyPeriod.Status == PolicyPeriodStatus.TC_RENEWING) {
        sendLetter = true
      }
    }

    if (sendLetter) {
      _log.info("Generating CPX Cancellation letter for policy=${policyPeriod.PolicyNumber}, levyYear=${policyPeriod.LevyYear_ACC}, jobType=${job.Subtype}, periodStatus=${policyPeriod.Status}")
      var bundle = policyPeriod.getBundle()
      var captureAction = RecordCaptureActionFactory.getRecordCaptureAction(OutBoundRecordType_ACC.TC_CPX_CANCEL, bundle)
      captureAction.captureFull(policyPeriod)
      policyPeriod.createCustomHistoryEvent(CustomHistoryType.TC_CPXLETTERS_ACC, \-> DisplayKey.get("Web.Admin.CPXLetters.WorkFlow.CancellationLetter"))
    }
  }

  private static function updateLevyYear(policyPeriod : PolicyPeriod) {
    var term = policyPeriod.PolicyTerm

    //set as soon as we have PeriodEnd date set on PolicyPeriod – set both levels (branch and term)
    if ((policyPeriod.isFieldChanged(PolicyPeriod#PeriodEnd) || policyPeriod.LevyYear_ACC == null or policyPeriod.Job typeis Renewal) and policyPeriod.PeriodEnd != null) {
      // DE2260 - Set the levy year correctly
      policyPeriod.LevyYear_ACC = DateUtil_ACC.nextACCLevyYearStart(policyPeriod.PeriodEnd.addDays(-1)).YearOfDate
      // Don't update the AEPFinancialYear if status is temporary as temporary policy period has incorrect data which will be rollback.
      // However, as the AEPFinancialYear is on PolicyTerm, it will be set permanently. So it shouldn't be updated if it is a temporary policy period.
      if (term.AEPFinancialYear_ACC == null or policyPeriod.Status != PolicyPeriodStatus.TC_TEMPORARY) {
        term.AEPFinancialYear_ACC = policyPeriod.LevyYear_ACC
      }
    }

    //If Term Levy Year is set, and not on branch … then copy down from Term (should always be same LevyYear for all branches within PolicyTerm)
    if (term.AEPFinancialYear_ACC != null and policyPeriod.LevyYear_ACC == null) {
      policyPeriod.LevyYear_ACC = term.AEPFinancialYear_ACC
    }

    if (term.AEPFinancialYear_ACC == null and policyPeriod.LevyYear_ACC != null) {
      term.AEPFinancialYear_ACC = policyPeriod.LevyYear_ACC
    }
  }

  /**
   * The rules for Policy period -- If there is a need to initiate a CPXUpdatesWPS instruction
   *
   * @param entity
   */
  private static function triggerCPXUpdatesWPSInstruction(policyPeriod : PolicyPeriod) {
    var job = policyPeriod.Job

    // Check whether this job is going to issue, reinstate, cancel, or change from/to a non-migrating CPX policy
    var isWPSUpdateRequiredForThisJob =
        (job.Subtype == typekey.Job.TC_SUBMISSION || job.Subtype == typekey.Job.TC_REINSTATEMENT || job.Subtype == typekey.Job.TC_CANCELLATION || job.Subtype == typekey.Job.TC_POLICYCHANGE)
            and
            (policyPeriod.INDCPXLineExists or policyPeriod.BasedOn?.INDCPXLineExists)
            and
            policyPeriod.Status == TC_BOUND

    if (isWPSUpdateRequiredForThisJob) {

      var acc = policyPeriod.Policy.Account

      var inst = new Instruction_ACC(policyPeriod.Bundle)
      inst.InstructionType_ACC = InstructionType_ACC.TC_CPXUPDATESWPS
      inst.IsSynchronous = false
      inst.AccountNumber = acc.AccountNumber
      inst.LevyYear = policyPeriod.LevyYear_ACC

      var builder = inst.WorkerBuilder as CPXUpdatesWPSWorkerBuilder
      builder.buildParameters(job.JobNumber, acc.ACCID_ACC)
      inst.doInitOfNewRecord()
    }
  }


  private static function setCUMaintainedByACCIfManualBICCodeChange(policyPeriod : PolicyPeriod) {
    if (policyPeriod.Status != PolicyPeriodStatus.TC_BOUND and policyPeriod.Status != PolicyPeriodStatus.TC_AUDITCOMPLETE) {
      return
    }

    var policy = policyPeriod.Policy

    if (policy.CU_Maintained_By_ACC) {
      return
    }

    if (policyPeriod.Job.TriggerReason_ACC == ReasonCode.TC_IR_ACC
        or policyPeriod.Job.TriggerReason_ACC == ReasonCode.TC_IRCUCHANGE_ACC) {
      return
    }

    var policyPeriodBasedOn = policyPeriod.BasedOn

    if (policyPeriodBasedOn != null && PolicyPeriodPreupdateUtil.hasBICCodesChanged(policyPeriod, policyPeriodBasedOn)) {
      _log.info("Period ${policyPeriod.PublicID} BIC Codes changed manually. Setting CU_Maintained_By_ACC = true")
      policy.CU_Maintained_By_ACC = true
    }
  }

}
