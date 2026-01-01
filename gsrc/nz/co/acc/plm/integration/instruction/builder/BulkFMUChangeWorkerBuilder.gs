package nz.co.acc.plm.integration.instruction.builder

uses gw.api.system.database.SequenceUtil
uses gw.pl.persistence.core.Bundle
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.BundleHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * WorkerBuilder for Bulk FMU Change...
 */
class BulkFMUChangeWorkerBuilder extends WorkerBuilderBase {

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
    var levyYear = parser.nextInt()
    var fmuValue = parser.nextString()

    if (! "TRUE".equalsIgnoreCase(fmuValue) && ! "FALSE".equalsIgnoreCase(fmuValue)) {
      throw new RuntimeException("A boolean value is expected")
    } else {
      fmuValue = fmuValue.toLowerCase()
    }

    var r = new InstructionWorker_ACC(b)
    r.SequencerKey = accNumber
    r.Parameters = productCode + InstructionConstantHelper.CSV_DELIMITER +
                   levyYear + InstructionConstantHelper.CSV_DELIMITER +
                   fmuValue
    r.InstructionExecStatus_ACC = InstructionExecStatus_ACC.TC_UNPROCESSED
    r.RecordSequence = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)

    r.Instruction_ACC = this.Instruction

    return r
  }
}