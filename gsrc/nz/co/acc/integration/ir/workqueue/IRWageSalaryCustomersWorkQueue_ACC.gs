package nz.co.acc.integration.ir.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.ir.inbound.IRInboundWorkQueueHelper

class IRWageSalaryCustomersWorkQueue_ACC extends WorkQueueBase<IRInboundRecord_ACC, StandardWorkItem> {
  private var _log = StructuredLogger.CONFIG.withClass(this)
  final var helper = new IRInboundWorkQueueHelper()
  final var PAGE_SIZE = 100000

  construct() {
    this(new IRInboundRecordProcessor())
  }

  construct(processor : IRInboundRecordProcessor) {
    super(BatchProcessType.TC_IRWAGESALARYCUSTOMERSWORKQUEUE_ACC, StandardWorkItem, IRInboundRecord_ACC)
    _log.info("Initialized")
  }

  override function findTargets() : Iterator<IRInboundRecord_ACC> {
    _log.info("Finding targets ...")

    var query = Query.make(IRInboundRecord_ACC)
        .compare(IRInboundRecord_ACC#IRExtRecordType_ACC, Relop.Equals, IRExtRecordType_ACC.TC_CARA4)
        .compareIn(IRInboundRecord_ACC#Status,
            {IRInboundRecordStatus_ACC.TC_UNPROCESSED,
                IRInboundRecordStatus_ACC.TC_NOACCOUNT,
                IRInboundRecordStatus_ACC.TC_NOPOLICY})
        .select()

    query.setPageSize(PAGE_SIZE)

    _log.info("Finished finding targets. Found ${query.Count} items to check")
    return query.iterator()
  }

  override function processWorkItem(workItem : StandardWorkItem) {
    var record = extractTarget(workItem)
    var status = helper.determineCARA4RecordStatus(record.PayloadString, record.ExternalKey)
    if(status != record.Status){
      _log.info("Updating IR record ${record.ID}, updating status from ${record.Status}, to ${status}")
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        record = bundle.add(record)
        record.setStatus(status)
        record.setRuntimeMessage(null)
      })
    }
  }

}