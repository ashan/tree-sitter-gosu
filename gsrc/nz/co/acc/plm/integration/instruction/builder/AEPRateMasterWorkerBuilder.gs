package nz.co.acc.plm.integration.instruction.builder

uses gw.api.system.database.SequenceUtil
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * Build worker to Rate AEP Master
 */
class AEPRateMasterWorkerBuilder extends WorkerBuilderBase {
  final var LOG = StructuredLogger_ACC.CONFIG.withClass(this)

  override public function buildWorker(bundle : Bundle) {
    LOG.info("buildWorker: AccountNumber=${Instruction.AccountNumber}, LevyYear=${Instruction.LevyYear}")
    if (Instruction.AccountNumber == null || Instruction.LevyYear == null) {
      throw new DisplayableException("AccountNumber and LevyYear can't be null [${Instruction.AccountNumber}][${Instruction.LevyYear}]!")
    }
    var account = Account.finder.findAccountByAccountNumber(Instruction.AccountNumber)
    var policy = account.AEPMasterPolicy_ACC

    if (policy == null) {
      throw new DisplayableException("Can't find MasterPolicy for Account[${Instruction.AccountNumber}]!")
    }
    var workerParam = buildWorkerParameter(policy)
    if (workerParam != null) {
      var worker = new InstructionWorker_ACC(bundle)
      worker.Instruction_ACC = Instruction
      worker.SequencerKey = account.ACCID_ACC
      worker.RecordSequence = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)
      worker.Parameters = workerParam
      worker.doInitOfNewRecord()
    }
  }

  /**
   * The parameter for audit is [PolicyNumber][EffDate]
   * @param policy
   * @return The param String
   */
  private function buildWorkerParameter(policy : Policy) : String {
    var latest = policy.getLatestBoundPeriodForLevyYear_ACC(Instruction.LevyYear)
    var workerParam : String = null
    if (latest != null) {
      workerParam = latest.PolicyNumber +
          InstructionConstantHelper.CSV_DELIMITER +
          latest.PeriodStart.format(InstructionConstantHelper.DATE_FORMAT_PATTERN_dMYHm)
    }
    return workerParam
  }

}