package nz.co.acc.integration.instruction.handler.impl

uses gw.api.util.DisplayableException
uses gw.job.RenewalProcess
uses gw.pl.persistence.core.Bundle

uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerUtil
uses nz.co.acc.integration.instruction.record.impl.ModifierInstructionRecord
uses nz.co.acc.integration.util.IntegrationPolicyChangeUtil
uses nz.co.acc.lob.util.ModifiersUtil_ACC
uses nz.co.acc.plm.integration.instruction.AutoSkippedError
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Process Modifier Instructions.
 * <p>
 * Copied from old integration.plm implementation
 * <p>
 * Created by Mike Ourednik on 5/02/2021.
 */
class ModifierInstructionRecordHandler extends InstructionRecordHandler<ModifierInstructionRecord> {
  static var _log =StructuredLogger.INTEGRATION.withClass(ModifierInstructionRecordHandler)
  var _helper = new InstructionRecordHandlerUtil(InstructionType_ACC.TC_BULKMODIFIERUPLOAD)

  var _programmeMap : HashMap<String, String> = {
      InstructionConstantHelper.PROGRAMME_KEY_STANDARD->ExpRatingProgramme_ACC.TC_STANDARD.Code,
      InstructionConstantHelper.PROGRAMME_KEY_EXPERIENCERATING->ExpRatingProgramme_ACC.TC_EXPERIENCERATING.Code,
      InstructionConstantHelper.PROGRAMME_KEY_NOCLAIMSDISCOUNT->ExpRatingProgramme_ACC.TC_NOCLAIMSDISCOUNT.Code
  }

  public construct(instructionRecord : ModifierInstructionRecord) {
    super(instructionRecord)
  }

  /**
   * Do policy change apply new modifier... Trigger the audit if need
   *
   * @param bundle
   */
  override public function processInstructionRecord(bundle : Bundle) {
    _log.info("Processing ${InstructionRecord}")

    if (InstructionRecord.JobType == InstructionConstantHelper.JOB_POLICYCHANGE) {
      processModifierChange(bundle)
    } else {
      processAudit(bundle, InstructionRecord.ACCID, InstructionRecord.ProductCode, InstructionRecord.LevyYear)
    }
  }

  function processModifierChange(bundle : Bundle) {
    var targets = _helper.findPolicyPeriodTargets(
        InstructionRecord.ACCID,
        InstructionRecord.ProductCode,
        InstructionRecord.LevyYear)

    if (targets.Empty) {
      // If this didnt find any match then check renewals as the record may be in a rewnewal state.
      doWorkForRenewals(InstructionRecord, bundle)
    }
    var nonAEPPeriods = targets.where(\pp -> not pp.IsAEPMemberPolicy_ACC)
    if (nonAEPPeriods.Empty and targets.hasMatch(\pp -> pp.IsAEPMemberPolicy_ACC)) {
      throw new AutoSkippedError("Won't update ER modifer for AEP member policy!")
    }

    checkPreviousYearHasNoOpenTransactions(InstructionRecord)
    nonAEPPeriods.each(\policyPeriod -> updateModifier(bundle, InstructionRecord, policyPeriod))
  }

  /**
   * This does not change modifiers. It only does final audits / final audit revisions
   *
   * @param bundle
   */
  function processAudit(bundle : Bundle, accID : String, productCode : String, levyYear : Integer) {
    _log.info("processAudit: accID=${accID}, productCode=${productCode}, levyYear=${levyYear}")

    var targets = _helper.findPolicyPeriodTargets(
        accID,
        productCode,
        levyYear)

    if (targets.Empty) {
      _log.info("processAudit: No periods for accID=${accID}, productCode=${productCode}, levyYear=${levyYear}")
      return
    }
    var nonAEPPeriods = targets.where(\pp -> not pp.IsAEPMemberPolicy_ACC)
    if (nonAEPPeriods.Empty and targets.hasMatch(\pp -> pp.IsAEPMemberPolicy_ACC)) {
      _log.info("processAudit: Not doing final audit for AEP member accID=${accID}, productCode=${productCode}, levyYear=${levyYear}")
      return
    }

    for (policyPeriod in nonAEPPeriods) {
      if (policyPeriod.Audit != null) {
        _helper.doAudit(policyPeriod.PolicyTerm, bundle)
      } else {
        _log.info("processAudit: No audit found for accID=${accID}, productCode=${productCode}, levyYear=${levyYear}")
      }
    }
  }

  private function checkPreviousYearHasNoOpenTransactions(record : ModifierInstructionRecord) {
    if (!ScriptParameters.BulkModifierUploadAuditEnabled_ACC
        or record.ProductCode.equalsIgnoreCase(InstructionConstantHelper.PRODUCTKEY_CP)) {
      return
    }
    var targets = _helper.findPolicyPeriodTargets(
        record.ACCID,
        record.ProductCode,
        record.LevyYear - 1)

    var nonAEPPeriods = targets.where(\pp -> not pp.IsAEPMemberPolicy_ACC)

    for (policyPeriod in nonAEPPeriods) {
      IntegrationPolicyChangeUtil.assertNoOpenPolicyTransactions(policyPeriod)
    }
  }

  private function updateModifier(bundle : Bundle, record : ModifierInstructionRecord, policyPeriod : PolicyPeriod) {
    policyPeriod.Policy.cleanUpInternalJobs_ACC(bundle, _helper.getReasonCode(), record.LevyYear)
    IntegrationPolicyChangeUtil.assertNoOpenPolicyTransactions(policyPeriod)

    if (policyPeriod.Audit == null) {
      doPolicyChangeToUpdateModifier(record, policyPeriod, bundle)
    } else {
      doAuditToUpdateModifier(record, policyPeriod, bundle)
    }

    if (ScriptParameters.BulkModifierUploadAuditEnabled_ACC) {
      if (policyPeriod.EMPWPCLineExists || policyPeriod.CWPSLineExists) {
        // do audit for previous year
        var previousYear = InstructionRecord.LevyYear - 1
        processAudit(bundle, InstructionRecord.ACCID, InstructionRecord.ProductCode, previousYear)
      }
    }
  }

  /**
   * Do policy change, apply new modifier, This is for Renewal Records only
   *
   * @param bundle
   */
  public function doWorkForRenewals(record : ModifierInstructionRecord, bundle : Bundle) {
    _log.info("doWorkForRenewals: accID=${record.ACCID}, productCode=${record.ProductCode}, levyYear=${record.LevyYear}")

    var targets = _helper.findPolicyPeriodTargetsForRenewals(
        record.ACCID, record.ProductCode, record.LevyYear)

    for (policyPeriod in targets) {
      var newPeriod = bundle.add(policyPeriod.getSlice(policyPeriod.EditEffectiveDate))
      var renewalProcess = (newPeriod.JobProcess as RenewalProcess)
      try {
        if (renewalProcess.ActiveRenewalWorkflow != null) {
          renewalProcess.ActiveRenewalWorkflow.invokeTrigger(TC_EDITPOLICY)
        } else {
          renewalProcess.edit()
        }
      } catch (e : RuntimeException) {
        // Can ignore all the uw issue for now as it will be dealed with later
        throw new DisplayableException("Can not edit policy period id=${policyPeriod.ID}", e)
      }
      ModifiersUtil_ACC.syncModifiers(newPeriod)
      // Apply the new Modifiers
      changeERModifiers(newPeriod, record)
      // Re-quote the policy
      if (newPeriod.Status == PolicyPeriodStatus.TC_DRAFT) {
        renewalProcess.requestQuote()
      }
      renewalProcess.pendingRenew()
    }
  }

  /**
   * Change modifier by PolicyChange...
   */
  private function doPolicyChangeToUpdateModifier(
      record : ModifierInstructionRecord,
      policyPeriod : PolicyPeriod,
      bundle : Bundle) {
    _log.info("doPolicyChangeToUpdateModifier: accID=${record.ACCID}, productCode=${record.ProductCode}, levyYear=${record.LevyYear}")

    var policyChange = new PolicyChange(bundle)
    _helper.setJobFlags(policyChange)
    policyChange.startJob(policyPeriod.Policy, policyPeriod.PeriodStart)

    var newPeriod = policyChange.LatestPeriod
    ModifiersUtil_ACC.syncModifiers(newPeriod)
    changeERModifiers(newPeriod, record)

    var theProcess = newPeriod.PolicyChangeProcess

    _helper.completePolicyChange(theProcess, newPeriod)
  }

  /**
   * Change modifier by FinalAudit
   *
   * @param policyPeriod
   * @param bundle
   */
  private function doAuditToUpdateModifier(
      record : ModifierInstructionRecord,
      policyPeriod : PolicyPeriod,
      bundle : Bundle) {
    _log.info("doAuditToUpdateModifier: accID=${record.ACCID}, productCode=${record.ProductCode}, levyYear=${record.LevyYear}")

    var newPeriod = bundle.add(policyPeriod).Audit.revise()

    var auditJob = newPeriod.Audit
    _helper.setJobFlags(auditJob)

    var auditInformation = auditJob.AuditInformation

    auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
    auditInformation.ReceivedDate = Date.CurrentDate

    var auditProcess = newPeriod.AuditProcess
    ModifiersUtil_ACC.syncModifiers(newPeriod)
    changeERModifiers(newPeriod, record)

    _helper.completeAudit(auditProcess, newPeriod)
  }

  /**
   * Change ER modifier for given period...
   */
  private function changeERModifiers(period : PolicyPeriod, record : ModifierInstructionRecord) {
    var mList = ModifiersUtil_ACC.getAllExperienceRatingModifiers(period)

    for (m in mList) {
      if (m.Pattern.CodeIdentifier.endsWith(InstructionConstantHelper.MODIFIER_SURFIX_RATE)) {
        m.RateModifier = record.Modifier
      } else if (m.Pattern.CodeIdentifier.endsWith(InstructionConstantHelper.MODIFIER_SURFIX_RUNNUMBER)) {
        m.RateModifier = record.RunID
      } else if (m.Pattern.CodeIdentifier.endsWith(InstructionConstantHelper.MODIFIER_SURFIX_PROGRAMME)) {
        m.TypeKeyModifier = _programmeMap.get(record.Programme)
      } else if (m.Pattern.CodeIdentifier.endsWith(InstructionConstantHelper.MODIFIER_SURFIX_MANUALREQUEST)) {
        m.BooleanModifier = record.ManualFlag
      } else if (m.Pattern.CodeIdentifier.endsWith(InstructionConstantHelper.MODIFIER_SURFIX_CALCTYPECODE)) {
        m.ShorttextModifier = record.CalcTypeCode
      }
    }
  }

}