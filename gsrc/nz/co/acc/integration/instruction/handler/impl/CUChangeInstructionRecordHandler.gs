package nz.co.acc.integration.instruction.handler.impl

uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle

uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerUtil
uses nz.co.acc.integration.instruction.handler.exception.PolicyNotFoundException
uses nz.co.acc.integration.instruction.record.impl.CUChangeInstructionRecord
uses entity.PolicyLine
uses entity.BusinessIndustryCode_ACC
uses nz.co.acc.integration.util.IntegrationPolicyChangeUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.util.finder.BICFinder_ACC

/**
 * Process CU Change Instructions.
 * <p>
 * Copied from old integration.plm implementation
 * <p>
 * Created by Mike Ourednik on 23/02/2021.
 */
class CUChangeInstructionRecordHandler extends InstructionRecordHandler<CUChangeInstructionRecord> {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(CUChangeInstructionRecordHandler)
  final var _helper = new InstructionRecordHandlerUtil(InstructionType_ACC.TC_BULKCUCHANGE)

  public construct(instructionRecord : CUChangeInstructionRecord) {
    super(instructionRecord)
  }

  /**
   * Do policy change here
   *
   * @param bundle
   */
  override public function processInstructionRecord(bundle : Bundle) {
    _log.info("Processing instruction: ${InstructionRecord}")

    var optionalBic = new BICFinder_ACC().findBusinessIndustryCode(InstructionRecord.BICCode, InstructionRecord.LevyYear)
    if (not optionalBic.Present) {
      throw new DisplayableException("BIC is not valid!")
    }
    var bic = optionalBic.get()

    var targets = _helper.findPolicyPeriodTargets(
        InstructionRecord.ACCID,
        InstructionRecord.ProductCode,
        InstructionRecord.LevyYear)

    if (targets.Empty) {
      throw new PolicyNotFoundException("Policy period not found for ${InstructionRecord}")
    }

    for (policyPeriod in targets) {
      cleanupJobs(bundle, policyPeriod.Policy)

      var code = extractBICCode(policyPeriod)
      if (code.BICCode == bic.BusinessIndustryCode) {
        _log.info("No CU change for ${InstructionRecord}")
      } else {
        IntegrationPolicyChangeUtil.assertNoOpenPolicyTransactions(policyPeriod)
        if (policyPeriod.Audit == null) {
          _log.info("Changing CU by policy change for ${InstructionRecord}")
          changeCUByPolicyChange(bic, policyPeriod, bundle)
        } else {
          _log.info("Changing CU by audit for ${InstructionRecord}")
          changeCUByAudit(bic, policyPeriod, bundle)
        }
      }
      var prevPolicyPeriod = policyPeriod.Policy.PolicyTermFinder_ACC
          .findPolicyTermForLevyYear(policyPeriod.LevyYear_ACC - 1)?.findLatestBoundOrAuditedPeriod_ACC()
      if (prevPolicyPeriod != null
          && prevPolicyPeriod.Lines[0].BICCodes*.BICCode.hasMatch(\bc -> bc == ScriptParameters.BICCodeNonRuralDefault_ACC || bc == ScriptParameters.BICCodeRuralDefault_ACC)) {
        IntegrationPolicyChangeUtil.assertNoOpenPolicyTransactions(prevPolicyPeriod)
        if (prevPolicyPeriod.Audit == null) {
          _log.info("Changing CU of previous period by policy change for ${InstructionRecord}")
          changeCUByPolicyChange(bic, prevPolicyPeriod, bundle)
        } else {
          _log.info("Changing CU of previous period by audit for ${InstructionRecord}")
          changeCUByAudit(bic, prevPolicyPeriod, bundle)
        }
      }
    }
  }

  /**
   * Extract Bic Code from policyPeriod
   *
   * @param pp The given PolicyPeriod
   * @return bicCode
   */
  private function extractBICCode(pp : PolicyPeriod) : PolicyLineBusinessClassificationUnit_ACC {
    var lines = pp.getLines()
    var line : PolicyLine
    if (lines?.Count != 1) {
      if (pp.INDCoPLineExists) {
        line = pp.INDCoPLine
      } else {
        throw new DisplayableException("Policy has multiple line!")
      }
    } else {
      line = lines[0]
    }

    var codes = line.BICCodes

    if (codes.Count != 1) {
      throw new DisplayableException("Policy has multiple CU!")
    }

    return codes[0]
  }

  /**
   * Change CU by PolicyChange
   *
   * @param bic
   * @param lastPeriod
   * @param bundle
   */
  private function changeCUByPolicyChange(bic : BusinessIndustryCode_ACC, lastPeriod : PolicyPeriod, bundle : Bundle) {
    var policyChange = new PolicyChange(bundle)

    setJobFlags(policyChange)
    policyChange.startJob(lastPeriod.Policy, lastPeriod.PeriodStart)

    var newPeriod = policyChange.LatestPeriod
    var theProcess = newPeriod.PolicyChangeProcess
    applyCU(bic, newPeriod)

    _helper.completePolicyChange(theProcess, newPeriod)
  }

  /**
   * Change CU by FinalAudit
   *
   * @param bic
   * @param lastPeriod
   * @param bundle
   */
  private function changeCUByAudit(bic : BusinessIndustryCode_ACC, lastPeriod : PolicyPeriod, bundle : Bundle) {
    var editablePeriod = bundle.add(lastPeriod)
    var newPeriod = editablePeriod.Audit.revise()

    var auditJob = newPeriod.Audit
    setJobFlags(auditJob)

    var auditInformation = auditJob.AuditInformation

    auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
    auditInformation.ReceivedDate = Date.CurrentDate

    var auditProcess = newPeriod.AuditProcess

    applyCU(bic, newPeriod)
    _helper.completeAudit(auditProcess, newPeriod)
  }

  /**
   * Apply Bic Code to the given PolicyPeriod
   */
  private function applyCU(bic : BusinessIndustryCode_ACC, period : PolicyPeriod) {
    var code = extractBICCode(period)
    code.BICCode = bic.BusinessIndustryCode
    code.BICDescription = bic.BusinessIndustryDescription
    code.CUCode = bic.ClassificationUnit_ACC.ClassificationUnitCode
    code.CUDescription = bic.ClassificationUnit_ACC.ClassificationUnitDescription
    if (period.CWPSLineExists) {
      var shareholders = period.CWPSLine.PolicyShareholders
      if (shareholders?.HasElements) {
        shareholders.each(\s ->
            s.ShareholderEarnings.each(\se ->
                se.setCUCode(bic.ClassificationUnit_ACC.ClassificationUnitCode)))
      }
    }
  }

  function cleanupJobs(bundle : Bundle, policy : Policy) {
    if (InstructionRecord.InstructionSource == InstructionSource_ACC.TC_IR) {
      policy.cleanUpInternalJobs_ACC(bundle, InstructionType_ACC.TC_IRCUCHANGE.deriveReasonCode(),
          InstructionRecord.LevyYear)
    } else {
      policy.cleanUpInternalJobs_ACC(bundle, InstructionType_ACC.TC_BULKCUCHANGE.deriveReasonCode(),
          InstructionRecord.LevyYear)
    }

  }

  function setJobFlags(theJob : Job) {
    if (InstructionRecord.InstructionSource == InstructionSource_ACC.TC_IR) {
      theJob.setTriggerReason_ACC(InstructionType_ACC.TC_IRCUCHANGE.deriveReasonCode())
    } else {
      theJob.setTriggerReason_ACC(InstructionType_ACC.TC_BULKCUCHANGE.deriveReasonCode())
    }
    theJob.InternalJob_ACC = true
  }
}