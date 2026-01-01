package nz.co.acc.integration.ir.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Processes inbound records from IR.
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
class IRInboundRecordWorkQueue extends WorkQueueBase<IRProcessorKey_ACC, StandardWorkItem> {
  var _processor : IRInboundRecordProcessor
  private var _log = StructuredLogger.INTEGRATION.withClass(this)

  construct() {
    this(new IRInboundRecordProcessor())
  }

  construct(processor : IRInboundRecordProcessor) {
    super(BatchProcessType.TC_IRINBOUNDRECORDS_ACC, StandardWorkItem, IRProcessorKey_ACC)
    this._processor = processor
    _log.info("Initialized")
  }

  override function findTargets() : Iterator<IRProcessorKey_ACC> {
    _log.info("Finding targets ...")

    var result = Query.make(IRProcessorKey_ACC)
        .join("ACCID", IRInboundRecord_ACC, "SequencerKey")
        .compareNotIn(IRInboundRecord_ACC#Status, {
            IRInboundRecordStatus_ACC.TC_NOACCOUNT,
            IRInboundRecordStatus_ACC.TC_PROCESSED,
            IRInboundRecordStatus_ACC.TC_SKIPPEDBYUSER,
            IRInboundRecordStatus_ACC.TC_SKIPPEDBYSYSTEM
        })
        .join(IRInboundRecord_ACC#IRInboundBatch_ACC)
        .compare(IRInboundBatch_ACC#Status, Relop.Equals, IRInboundBatchStatus_ACC.TC_LOADED)
        .withDistinct(true)
        .select()
        .iterator()

    _log.info("Finished finding targets")
    return result
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var irProcessorKey = extractTarget(workItem)
    _processor.processWorkItem(irProcessorKey)
  }

}