package nz.co.acc.plm.integration.instruction.builder

uses gw.api.system.database.SequenceUtil
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * Build worker to Audit AEP Master
 */
class AEPAuditMasterWorkerBuilder extends WorkerBuilderBase {
  final var LOG = StructuredLogger_ACC.CONFIG.withClass(this)

  /**
   * Main function. To build the individual InstructionWorker_ACC
   * @param bundle
   */
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
    var params = buildWorkerParameter(policy)
    if (params != null) {
      var worker = new InstructionWorker_ACC(bundle)
      worker.Instruction_ACC = Instruction
      worker.SequencerKey = account.ACCID_ACC
      worker.RecordSequence = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)
      worker.Parameters = params
      worker.doInitOfNewRecord()
    }
  }

  /**
   * The parameter for audit is [PolicyNumber][LevyYear]
   * @param policy
   * @return The param String
   */
  private function buildWorkerParameter(policy : Policy) : String {
    var latest = policy.LatestPeriod
    var params : String = null
    if (latest != null) {
      params = latest.PolicyNumber +
          InstructionConstantHelper.CSV_DELIMITER +
          this.Instruction.LevyYear
    }
    return params
  }
}