package nz.co.acc.integration.instruction.handler.impl

uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerUtil
uses nz.co.acc.integration.instruction.record.impl.BlankPolicyChangeRecord
uses nz.co.acc.util.finder.FinderUtil_ACC

class BlankPolicyChangeRecordHandler extends InstructionRecordHandler<BlankPolicyChangeRecord> {
  final var _helper = new InstructionRecordHandlerUtil(InstructionType_ACC.TC_BULKISSUEBLANKPOLICYCHANGE)
  protected final var _log : StructuredLogger_ACC = StructuredLogger_ACC.CONFIG.withClass(BlankPolicyChangeRecordHandler)

  construct(instructionRecord : BlankPolicyChangeRecord) {
    super(instructionRecord)
  }

  override function processInstructionRecord(bundle : Bundle) {
    _log.info("Processing ${InstructionRecord}")

    var policyterm = FinderUtil_ACC.findLatestPolicyTerm(
        InstructionRecord.ACCID,
        InstructionRecord.ProductCode,
        InstructionRecord.LevyYear)

    if (policyterm == null) {
      throw new RuntimeException("policyterm not found")
    }

    var latestPeriod = policyterm.findLatestBoundOrAuditedPeriod_ACC()

    if (latestPeriod.isAudited_ACC) {
      doFinalAuditRevision(latestPeriod, bundle)
    } else {
      doPolicyChange(latestPeriod, bundle)
    }
  }

  function doFinalAuditRevision(period : PolicyPeriod, bundle : Bundle) {
    _log.info("Doing audit revision for policyNumber=${period.PolicyNumber}, levyYear=${period.LevyYear_ACC}")
    period = bundle.add(period)
    var newPeriod = period.Audit.revise()

    var auditJob = newPeriod.Audit
    auditJob.setTriggerReason_ACC(ReasonCode.TC_BULKUPDATE_ACC)
    auditJob.InternalJob_ACC = true

    var auditInformation = auditJob.AuditInformation

    auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
    auditInformation.ReceivedDate = Date.CurrentDate

    var auditProcess = newPeriod.AuditProcess

    newPeriod.recalculateLiableEarnings()

    if (auditProcess.canRequestQuote().Okay) {
      auditProcess.requestQuote()
    }
    if (auditProcess.canComplete().Okay) {
      auditProcess.complete()
    }
  }

  function doPolicyChange(period : PolicyPeriod, bundle : Bundle) {
    _log.info("Doing policy change for policyNumber=${period.PolicyNumber}, levyYear=${period.LevyYear_ACC}")

    var policy = period.Policy
    policy.cleanUpInternalJobs_ACC(bundle, ReasonCode.TC_BULKUPDATE_ACC)

    var policyChange = new PolicyChange(bundle)
    policyChange.setTriggerReason_ACC(ReasonCode.TC_BULKUPDATE_ACC)
    policyChange.InternalJob_ACC = true
    policyChange.startJob(policy, period.PeriodStart)

    var newPeriod = policyChange.LatestPeriod
    var process = newPeriod.PolicyChangeProcess

    newPeriod.recalculateLiableEarnings()

    if (process.canRequestQuote().Okay) {
      process.requestQuote()
    }

    if (process.canBind().Okay && process.canIssue().Okay) {
      process.issueJob(true)
    }
  }

}