package nz.co.acc.integration.instruction.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase

uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerFactory
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Processes modifier instruction records
 * <p>
 * Created by Mike Ourednik on 5/02/2021.
 */
class ERModifierInstructionWorkQueue extends WorkQueueBase<Account, StandardWorkItem> {
  static final var _log = StructuredLogger.INTEGRATION.withClass(ERModifierInstructionWorkQueue)

  final var _processor = new InstructionWorkItemProcessor(
      {InstructionType_ACC.TC_BULKMODIFIERUPLOAD},
      new InstructionRecordHandlerFactory())

  public construct() {
    super(BatchProcessType.TC_ERMODIFIERINSTRUCTIONWORKQUEUE_ACC, StandardWorkItem, Account)
    _log.info("Initialized")
  }

  override function findTargets() : Iterator<Account> {
    _log.info("Finding accounts to process...")
    var result = Query.make(Account)
        .join("ACCID_ACC", InstructionRecord_ACC, "ACCID")
        .compareNotIn(InstructionRecord_ACC#Status, {
            InstructionRecordStatus_ACC.TC_PROCESSED,
            InstructionRecordStatus_ACC.TC_SKIPPED
        })
        .compare(InstructionRecord_ACC#InstructionType_ACC, Relop.Equals, InstructionType_ACC.TC_BULKMODIFIERUPLOAD)
        .withDistinct(true)
        .select()
    return result.iterator()
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var account = extractTarget(workItem)
    _processor.processWorkItem(account.ACCID_ACC)
  }

}