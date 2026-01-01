package nz.co.acc.integration.instruction.workqueue

uses gw.api.database.Query
uses gw.processes.WorkQueueBase

uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerFactory
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Processes instruction records (except modifiers)
 * <p>
 * Created by Mike Ourednik on 5/02/2021.
 */
class InstructionWorkQueue extends WorkQueueBase<Account, StandardWorkItem> {
  static final var _log = StructuredLogger.INTEGRATION.withClass(InstructionWorkQueue)

  final var _instructionTypes = {
      InstructionType_ACC.TC_BULKCUCHANGE,
      InstructionType_ACC.TC_ADDRESSENDDATE,
      InstructionType_ACC.TC_ADDRESSFLAGS,
      InstructionType_ACC.TC_BULKEDITPRIMARYCONTACT,
      InstructionType_ACC.TC_BULKISSUEBLANKPOLICYCHANGE,
      InstructionType_ACC.TC_BULKEDITPRIMARYCONTACT,
      InstructionType_ACC.TC_IRMANUALRETRY,
      InstructionType_ACC.TC_DOCUMENTREMOVAL,
      InstructionType_ACC.TC_BULKWPCEARNINGCHANGE,
      InstructionType_ACC.TC_VALIDFORCLAIMS,
      InstructionType_ACC.TC_RENEWAL
  }.toSet()

  final var _processor = new InstructionWorkItemProcessor(
      _instructionTypes,
      new InstructionRecordHandlerFactory())

  public construct() {
    super(BatchProcessType.TC_INSTRUCTIONWORKQUEUE_ACC, StandardWorkItem, Account)
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
        .compareIn(InstructionRecord_ACC#InstructionType_ACC, _instructionTypes.toTypedArray())
        .withDistinct(true)
        .select()
    return result.iterator()
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var account = extractTarget(workItem)
    _processor.processWorkItem(account.ACCID_ACC)
  }

}