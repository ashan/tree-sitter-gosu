package nz.co.acc.plm.integration.instruction.handler

uses gw.api.database.Query
uses gw.api.system.database.SequenceUtil
uses gw.api.util.DisplayableException
uses gw.job.AuditProcess
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.instruction.AutoSkippedError
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.exec.handler.actions.ActionsUtil
uses nz.co.acc.plm.integration.ir.util.BundleHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * WorkHandler for DMAEPMemberMgmt
 */
class DMAEPMemberMgmtWorkHandler extends WorkHandlerBase {

  private var _productCode : String
  private var _actionName : String
  private var _levyYear : Integer

  /**
   * Load the Parameters.
   *
   * The expected value is "[Product],[Action],[EffDate]"
   */
  override public function loadParameters() {
    var values : String[]
    var params = this.InstructionWorker.Parameters

    if (params != null) {
      values = params.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || (values.length != 3 && values.length != 2)) {
      throw new DisplayableException("Parameters[${InstructionWorker.Parameters}] is not valid!")
    }
    if (values.length == 3) {
      //Cancel/Rewrite parameters
      _productCode = values[0]
      _actionName = values[1]
      if (!_actionName.equalsIgnoreCase(InstructionConstantHelper.ACTION_EXIT)
          && !_actionName.equalsIgnoreCase(InstructionConstantHelper.ACTION_ENTRY)) {
        throw new DisplayableException("Wrong action name[${_actionName}]!")
      }
      _effDate = InstructionConstantHelper.DATE_FORMAT_yMd.parse(values[2])
    } else {
      //Audit Parameters
      _policyNumber = values[0]
      _levyYear = Integer.valueOf(values[1])
    }
  }

  /**
   * Do policy change here
   * @param bundle
   */
  override public function doWork(bundle : Bundle) {
    if (_actionName != null) {
      doCancelRewrite(bundle)
    } else {
      doAudit(_policyNumber, _levyYear, bundle)
    }
  }

  /**
   * Perform cancel/rewrite to move policy from source to target
   */
  private function doCancelRewrite(bundle : Bundle) {
    var masterAccount = Account.finder.findAccountByAccountNumber(this.InstructionWorker.Instruction_ACC.AccountNumber)
    if (masterAccount == null) {
      throw new DisplayableException("Can't find master account!")
    }
    var memberAccount = ActionsUtil.getAccountByAccNumber(InstructionWorker.SequencerKey)
    if (memberAccount == null) {
      throw new DisplayableException("Can't find member account by[${InstructionWorker.SequencerKey}]!")
    }
    var sourceAcc : Account
    var targetAcc : Account

    if (_actionName.equalsIgnoreCase(InstructionConstantHelper.ACTION_ENTRY)) {
      sourceAcc = memberAccount
      targetAcc = masterAccount
    } else {
      sourceAcc = masterAccount
      targetAcc = memberAccount
    }
    var levyYear = InstructionWorker.Instruction_ACC.LevyYear
    var accNum = InstructionWorker.SequencerKey

    var target = findAEPPolicyPeriodTarget(accNum, levyYear, _productCode)
    var policy = target.Policy
    policy.cleanUpInternalJobs_ACC(bundle, getReasonCode())
    var newPNumber : String = null
    var jobs : Job[]

    if (! target.isCanceled()) {
      if (policy.Account != sourceAcc) {
        throw new AutoSkippedError("Can't perform [${_actionName}] for [${InstructionWorker.SequencerKey}]!")
      }

      var term = target.PolicyTerm
      var cancelledPPs = term.Periods.where(\pp -> pp != target && pp.isCanceled() && pp.CreateTime > target.CreateTime)
      var editTarget : PolicyPeriod

      if (cancelledPPs.HasElements && cancelledPPs.Count == 1) {
        editTarget = BundleHelper.explicitlyAddBeanToBundle(bundle, cancelledPPs.first(), false)
      } else {
        editTarget = BundleHelper.explicitlyAddBeanToBundle(bundle, target, false)
      }

      newPNumber = "${accNum}${_productCode}${levyYear}_${deriveWorkerIndex()}"
      jobs = editTarget.rewriteMigratedPolicy_ACC(targetAcc, _effDate, newPNumber)
      jobs.each(\j -> {
        setJobFlags(j)
      })
    } else {
      throw new DisplayableException("The policy is already cancelled!")
    }

    if (deriveNeedAudit(jobs, target)) {
      var auditPNumber = newPNumber
      if (deriveMidTermEntry(target)) {
        auditPNumber = target.PolicyNumber
      }
      buildAuditWorker(auditPNumber, levyYear, bundle)
    }
  }

  /**
   * The count for same instruction and same SequencerKey
   * @return The index for this worker
   */
  protected function deriveWorkerIndex() : Integer {
    var worker = InstructionWorker
    var instruction = InstructionWorker.Instruction_ACC
    var theCount = instruction.InstructionWorker_ACCs
                        .where(\w -> w.SequencerKey == worker.SequencerKey
                                     && w.Parameters?.startsWith(_productCode + InstructionConstantHelper.CSV_DELIMITER)
                                     && w.RecordSequence <= worker.RecordSequence
                                     && w != worker).Count
    return theCount + 1
  }

  /**
   * Do we need to create audit for this target
   */
  protected function deriveNeedAudit(jobs : Job[], target : PolicyPeriod) : boolean {
    var result = jobs?.last().MigrationJobInfo_ACC.AEPMigrationInfo.AEPWPCWPSAuditRequired

    if (_actionName.equalsIgnoreCase(InstructionConstantHelper.ACTION_EXIT)) {
      return result
    }
    if (deriveMidTermEntry(target)) {
      return result
    }
    return false
  }

  /**
   * Is this mid term entry?
   */
  protected function deriveMidTermEntry(target : PolicyPeriod) : boolean {
    if (_actionName.equalsIgnoreCase(InstructionConstantHelper.ACTION_ENTRY)
                 && deriveWorkerIndex() == 1 && _effDate.trimToMidnight() != target.PeriodStart.trimToMidnight()) {
      return true
    }
    return false
  }

  /**
   * Build audit workers
   *
   * @return InstructionWorker_ACC
   */
  private function buildAuditWorker(pNumber : String, levyYear: Integer, b : Bundle) : InstructionWorker_ACC {

    var r = new InstructionWorker_ACC(b)
    r.SequencerKey = InstructionWorker.SequencerKey

    r.Parameters = pNumber + InstructionConstantHelper.CSV_DELIMITER +
        levyYear

    r.InstructionExecStatus_ACC = InstructionExecStatus_ACC.TC_UNPROCESSED
    r.RecordSequence = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)

    r.Instruction_ACC = InstructionWorker.Instruction_ACC
    r.doInitOfNewRecord()
    return r
  }

  /**
   * Override base doAudit function in order to set MigrationJobInfo on final audit job from
   * previous job.
   * @param bundle The given Bundle
   */
  override protected function doAudit(policyNumber : String, levyYear : Integer, bundle : Bundle) {
    var fn = "doAudit"
    var policy = findPolicyByPolicyNumberIfCan(policyNumber)

    if (policy == null) {
      throw new DisplayableException("Can't find the Policy to do Audit!")
    }
    policy.cleanUpInternalJobs_ACC(bundle, getReasonCode())
    var ppQ = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#Policy, Equals, policy)
        .compare(PolicyPeriod#LevyYear_ACC, Equals, levyYear)
        .compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
    var ppList = ppQ.select()

    if (! ppList.HasElements) {
      throw new DisplayableException("Can't find the Policy to do Audit for LevyYear[${levyYear}]!")
    }
    var latest = ppList.toList().orderBy(\pp -> pp.PeriodEnd)
        .thenBy(\pp -> pp.CreateTime)
        .thenBy(\pp -> pp.UpdateTime).last()

    // Save MigrationJobInfo from Cancellation or Rewrite job depending on whether it's
    // mid-term entry or exit.
    var migrationJobInfo = latest.Job.MigrationJobInfo_ACC

    if (latest.Audit == null) {
      //do Audit
      StructuredLogger.INTEGRATION.info(this + " " + fn + " " + "Do an Audit Job!")
      var auditInformations = latest.AuditInformations
      if (auditInformations == null || ! auditInformations.HasElements) {
        throw new DisplayableException("Can't find the AuditInformation for LevyYear[${levyYear}]!")
      }
      var auditInformation = latest.AuditInformations[0]
      auditInformation = bundle.add(auditInformation)

      auditInformation.withdrawUnboundPolicyChanges()
      auditInformation.startAuditJob()
      auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
      auditInformation.ReceivedDate = Date.CurrentDate

      var job = auditInformation.Audit
      setJobFlags(job)

      // Set migrationJobInfo on final audit job so that it is handled correctly by PC.
      job.MigrationJobInfo_ACC = migrationJobInfo

      var newPeriod = job.LatestPeriod

      var auditProcess = newPeriod.AuditProcess

      completeAudit(auditProcess, newPeriod)
    } else {
      //do revise Audit
      StructuredLogger.INTEGRATION.info( this + " " + fn + " " + "Do an Audit Revision Job!")
      var editablePeriod = bundle.add(latest)
      var newPeriod = editablePeriod.Audit.revise()

      var auditJob = newPeriod.Audit
      setJobFlags(auditJob)

      // Set migrationJobInfo on final audit job so that it is handled correctly by PC.
      auditJob.MigrationJobInfo_ACC = migrationJobInfo

      var auditInformation = auditJob.AuditInformation

      auditInformation.AuditMethod = AuditMethod.TC_MANUAL_ACC
      auditInformation.ReceivedDate = Date.CurrentDate

      var auditProcess = newPeriod.AuditProcess

      completeAudit(auditProcess, newPeriod)
    }
  }

  /**
   *  Quote and Complete Audit
   */
  override protected function completeAudit(process : AuditProcess, latest : PolicyPeriod) {
    if (process.canRequestQuote().Okay) {
      process.requestQuote()
    }
    if (process.canComplete().Okay) {
      process.complete()
    }
  }
}