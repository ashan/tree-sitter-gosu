package nz.co.acc.plm.integration.instruction.builder

uses gw.api.system.database.SequenceUtil
uses gw.pl.persistence.core.Bundle
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.BundleHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * WorkerBuilder for Bulk CP Earnings Change...
 */
class BulkCPEarningsChangeWorkerBuilder extends WorkerBuilderBase {

  /**
   * Build worker Bulk CP earnings Change
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
    var levyYear = parser.nextInt()
    var netSchedulerPayments = parser.nextString()
    var totalActivePartnershipIncome = parser.nextString()
    var adjLTCIncome = parser.nextString()
    var selfEmployedNetIncome = parser.nextString()
    var totalExpensesClaimed = parser.nextString()
    var invEarningsNotLiable = parser.nextString()
    var earningsAsEmployeeTotalGrossIncome = parser.nextString()
    var totalSHEEmployeeSalary = parser.nextString()
    var totalEmpIncomeNotLiableEarnersLevy = parser.nextString()
    var totalOtherNetIncome = parser.nextString()
    var totalOverseasIncome = parser.nextString()
    var previousYearsLE = parser.nextString()
    var ceasedYearsActualLE = parser.nextString()

    var r = new InstructionWorker_ACC(b)
    r.SequencerKey = accNumber
    r.Parameters = levyYear + InstructionConstantHelper.CSV_DELIMITER +
                   netSchedulerPayments + InstructionConstantHelper.CSV_DELIMITER +
                   totalActivePartnershipIncome + InstructionConstantHelper.CSV_DELIMITER +
                   adjLTCIncome + InstructionConstantHelper.CSV_DELIMITER +
                   selfEmployedNetIncome + InstructionConstantHelper.CSV_DELIMITER +
                   totalExpensesClaimed + InstructionConstantHelper.CSV_DELIMITER +
                   invEarningsNotLiable + InstructionConstantHelper.CSV_DELIMITER +
                   earningsAsEmployeeTotalGrossIncome + InstructionConstantHelper.CSV_DELIMITER +
                   totalSHEEmployeeSalary + InstructionConstantHelper.CSV_DELIMITER +
                   totalEmpIncomeNotLiableEarnersLevy + InstructionConstantHelper.CSV_DELIMITER +
                   totalOtherNetIncome + InstructionConstantHelper.CSV_DELIMITER +
                   totalOverseasIncome + InstructionConstantHelper.CSV_DELIMITER +
                   previousYearsLE + InstructionConstantHelper.CSV_DELIMITER +
                   ceasedYearsActualLE
    r.InstructionExecStatus_ACC = InstructionExecStatus_ACC.TC_UNPROCESSED
    r.RecordSequence = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)

    r.Instruction_ACC = this.Instruction

    return r
  }
}
