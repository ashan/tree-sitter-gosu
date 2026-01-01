package nz.co.acc.integration.instruction.handler.impl

uses gw.api.util.DisplayableException
uses gw.job.PolicyChangeProcess
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerUtil
uses nz.co.acc.integration.instruction.record.impl.BulkWPCEarningChangeRecord
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper
uses nz.co.acc.util.finder.FinderUtil_ACC

class BulkWPCEarningChangeRecordHandler extends InstructionRecordHandler<BulkWPCEarningChangeRecord> {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(BulkWPCEarningChangeRecordHandler)
  final var _helper = new InstructionRecordHandlerUtil(InstructionType_ACC.TC_BULKWPCEARNINGCHANGE)

  construct(instructionRecord : BulkWPCEarningChangeRecord) {
    super(instructionRecord)
  }

  override function processInstructionRecord(bundle : Bundle) {
    _log.info("Processing ${InstructionRecord}")
    var record = this.InstructionRecord
    var targets = FinderUtil_ACC
        .findPolicyTerms(record.ACCID, ConstantPropertyHelper.PRODUCTCODE_WPC, record.LevyYear)
        .map(\pt -> pt.findLatestBoundOrAuditedPeriod_ACC())
        .where(\pp -> pp != null and pp.PeriodStart != pp.CancellationDate)

    if (targets == null || targets.length == 0) {
      throw new DisplayableException("Can not find any targets to update!")
    }

    targets.each(\policyPeriod -> {
      var policy = policyPeriod.Policy
      policy.cleanUpInternalJobs_ACC(bundle,
          this.InstructionRecord.InstructionType.deriveReasonCode(),
          record.LevyYear)

      if (policyPeriod.Audit == null) {
        if (hasEarningChange(policyPeriod)) {
          changeEarningsByPolicyChange(policyPeriod, bundle)
          policy.withdrawDraftAudits(bundle, record.LevyYear)
        }
      } else {
        if (hasEarningChange(policyPeriod)) {
          changeEarningsByRevisedAudit(policyPeriod, bundle)
        }
      }
    })
  }

  /**
   * Check if new Earnings are different from the given PolicyPeriod
   */
  private function hasEarningChange(period : PolicyPeriod) : boolean {
    if ((this.InstructionRecord.TotalNotLiableEarnings != null and period.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov.TotalEarningsNotLiable != this.InstructionRecord.TotalNotLiableEarnings) or
        (this.InstructionRecord.TotalGrossEarnings != null and period.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov.TotalGrossEarnings != this.InstructionRecord.TotalGrossEarnings) or
        (this.InstructionRecord.TotalScheduledPmnt != null and period.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov.TotalPAYE != this.InstructionRecord.TotalScheduledPmnt) or
        (this.InstructionRecord.TotalExcess != null and period.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov.TotalExcessPaid != this.InstructionRecord.TotalExcess) or
        (this.InstructionRecord.FirstWeek != null and period.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov.PaymentToEmployees != this.InstructionRecord.FirstWeek) or
        (this.InstructionRecord.PostWeek != null and period.EMPWPCLine.EMPWPCCovs.first().LiableEarningCov.PaymentAfterFirstWeek != this.InstructionRecord.PostWeek)) {
      return true
    } else {
      return false
    }
  }

  /**
   * Change Earnings by PolicyChange
   *
   * @param lastPeriod
   * @param bundle
   */
  private function changeEarningsByPolicyChange(lastPeriod : PolicyPeriod, bundle : Bundle) {
    var policyChange = new PolicyChange(bundle)

    _helper.setJobFlags(policyChange)
    policyChange.startJob(lastPeriod.Policy, lastPeriod.PeriodStart)

    var newPeriod = policyChange.LatestPeriod
    var theProcess = newPeriod.PolicyChangeProcess
    applyEarnings(newPeriod)
    _helper.completePolicyChange(theProcess, newPeriod)
  }

  /**
   * Issue a revised Audit where an Audit already exists
   * @param lastPeriod
   * @param bundle
   */
  private function changeEarningsByRevisedAudit(lastPeriod : PolicyPeriod, bundle : Bundle){
    //do revised Audit
    var latest = lastPeriod
    var levyYear = latest.LevyYear_ACC
    var policyNumber = latest.PolicyNumber
    _log.info("Doing audit revision for policyNumber=${policyNumber}, levyYear=${levyYear}")
    var editablePeriod = bundle.add(latest)
    var newPeriod = editablePeriod.Audit.revise()

    var auditJob = newPeriod.Audit
    _helper.setJobFlags(auditJob)

    var auditInformation = auditJob.AuditInformation

    auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
    auditInformation.ReceivedDate = Date.CurrentDate

    var auditProcess = newPeriod.AuditProcess
    applyEarnings(newPeriod)
    _helper.completeAudit(auditProcess, newPeriod)
  }

  /**
   * Apply new Earnings from file to the given PolicyPeriod
   */
  private function applyEarnings(period : PolicyPeriod) {
    var empCoverage = period.EMPWPCLine.EMPWPCCovs.first()
    if (this.InstructionRecord.TotalNotLiableEarnings != null) {
      empCoverage.LiableEarningCov.TotalEarningsNotLiable = this.InstructionRecord.TotalNotLiableEarnings.toMonetaryAmount()
    }
    if (this.InstructionRecord.TotalGrossEarnings != null) {
      empCoverage.LiableEarningCov.TotalGrossEarnings = this.InstructionRecord.TotalGrossEarnings.toMonetaryAmount()
    }
    if (this.InstructionRecord.TotalScheduledPmnt != null) {
      empCoverage.LiableEarningCov.TotalPAYE = this.InstructionRecord.TotalScheduledPmnt.toMonetaryAmount()
    }
    if (this.InstructionRecord.TotalExcess != null) {
      empCoverage.LiableEarningCov.TotalExcessPaid = this.InstructionRecord.TotalExcess.toMonetaryAmount()
    }
    if (this.InstructionRecord.FirstWeek != null) {
      empCoverage.LiableEarningCov.PaymentToEmployees = this.InstructionRecord.FirstWeek.toMonetaryAmount()
    }
    if (this.InstructionRecord.PostWeek != null) {
      if (empCoverage.LiableEarningCov.ERAIndicator_ACC) {
        empCoverage.LiableEarningCov.PaymentAfterFirstWeek = this.InstructionRecord.PostWeek.toMonetaryAmount()
      } else {
        throw new DisplayableException("Can not add post week payment to customer not on ERA")
      }
    }
    empCoverage.calculateBICLiableEarnings()
  }
}