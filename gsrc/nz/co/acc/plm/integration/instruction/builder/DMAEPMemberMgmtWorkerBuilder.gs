package nz.co.acc.plm.integration.instruction.builder

uses gw.api.system.database.SequenceUtil
uses gw.pl.persistence.core.Bundle
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.exec.handler.actions.ActionsUtil
uses nz.co.acc.plm.integration.ir.util.BundleHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * This is builder to build APE Migration bulk entry/exit workers...
 */
class DMAEPMemberMgmtWorkerBuilder extends WorkerBuilderBase {

  /**
   * Build worker Bulk CU Change
   * @param bundle
   */
  override public function buildWorker(bundle : Bundle) {
    var records = findUprocessedWorkers()
    records.each(\rec -> {
      var worker = BundleHelper.explicitlyAddBeanToBundle(bundle, rec, false)
      worker.doInitOfNewRecord()
    })
  }

  /**
   * Build unprocessed workers, can be extended.
   *
   * @param parser CSVParser
   * @param b Bundle
   * @return InstructionWorker_ACC
   */
  override protected function buildUnprocessedWorker(parser : CSVParser, b : Bundle) : InstructionWorker_ACC {
    var accNumber = parser.nextString()
    var productCode = parser.nextString()
    var actionName = parser.nextString()
    var effDate = parser.nextString()

    var r = new InstructionWorker_ACC(b)
    r.SequencerKey = accNumber
    r.Parameters = productCode + InstructionConstantHelper.CSV_DELIMITER
        + actionName + InstructionConstantHelper.CSV_DELIMITER
        + effDate
    r.InstructionExecStatus_ACC = InstructionExecStatus_ACC.TC_UNPROCESSED
    r.RecordSequence = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)

    r.Instruction_ACC = this.Instruction

    return r
  }

  /**
   * Process Heading
   * @param parser CSVParser
   * @param b Bundle
   */
  override protected function processHeading(parser : CSVParser, b : Bundle) {
    var masterACCNumber = parser.nextString()
    var account = ActionsUtil.getAccountByAccNumber(masterACCNumber)
    if (account == null) {
      throw new RuntimeException("Can not find an Account by [${masterACCNumber}]")
    }
    this.Instruction.AccountNumber = account.AccountNumber
    var levyYear = parser.nextInt()
    this.Instruction.LevyYear = levyYear
  }
}