package nz.co.acc.plm.integration.ir.stats

uses gw.api.admin.WorkflowUtil
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.processes.BatchProcessBase

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Updates IR batch statistics, visible on the IR Inbound Batches page.
 */
class UpdateIRInboundWorkQueueStatsBatch_ACC extends BatchProcessBase {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  construct() {
    super(BatchProcessType.TC_UPDATEIRINBOUNDWORKQUEUESTATS_ACC)
  }

  /**
   * Override doWork method
   */
  protected override function doWork() {
    _log.info("UpdateIRInboundWorkQueueStatsBatch_ACC started")
    calculateIRStatus()
    retryBlockedInstructions()
    calculateInstructionStatus()
    _log.info("UpdateIRInboundWorkQueueStatsBatch_ACC finished")
  }

  /**
   * Calculate status for new batches
   */
  private function calculateIRStatus() {
    _log.info("Finding IRInboundBatch_ACC records to process ..")

    var batchStartedTimestamp = Date.Now

    var lastUpdatedBatch = Query
        .make(IRInboundBatch_ACC)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(IRInboundBatch_ACC#LastStatsBatchRunTimestamp)))
        .FirstResult

    var lastUpdateTimestamp = lastUpdatedBatch?.LastStatsBatchRunTimestamp

    var batchQuery = Query.make(IRInboundBatch_ACC)

    if (lastUpdateTimestamp != null) {
      batchQuery
          .join(IRInboundRecord_ACC#IRInboundBatch_ACC)
          .compare(IRInboundRecord_ACC#UpdateTime, Relop.GreaterThanOrEquals, lastUpdateTimestamp)
          .withDistinct(true)
    }

    var batches = batchQuery.select()
    var total = batches.Count
    var count = 0

    _log.info("Found ${total} IRInboundBatch_ACC records to process")

    for (batch in batches) {
      count += 1
      try {
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          _log.info("Processing batch ${count} of ${total}")
          batch = b.add(batch)
          var batchStats = new IRBatchStats(batch)
          batchStats.rebuildStats()
          batch.setLastStatsBatchRunTimestamp(batchStartedTimestamp)
        })
        incrementOperationsCompleted()
      } catch (e : Exception) {
        incrementOperationsFailed()
        _log.error_ACC("Failed to process batch ${batch.PublicID}", e)
      }
    }

    _log.info("Finished processing ${count} of ${total} batches.")
  }

  /**
   * Calculate status for new Instructions
   */
  private function calculateInstructionStatus() {
    var instructions = findInstructionsToProcess()
    var total = instructions.Count
    var count = 0

    while (instructions.HasElements) {
      var instruction = instructions.poll()
      count += 1
      _log.info("Processing instruction ${count} of ${total}")
      try {
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var editInstruction = b.add(instruction)
          editInstruction.reloadStats()
          _log.debug("Processed instruction [${instruction.ID}].")
          incrementOperationsCompleted()
        })
      } catch (e : Exception) {
        incrementOperationsFailed()
       _log.warn_ACC("Error while processing instruction[${instruction.ID}]. Error: ${e.getMessage()}")
      }
    }

    _log.info("Finished processing ${total} Instruction_ACC records.")
  }

  private function findInstructionsToProcess(): LinkedList<Instruction_ACC> {
    _log.info("Finding Instruction_ACC records to process ..")
    var instructionQuery = Query.make(Instruction_ACC)
    if (ScriptParameters.StatsCalculateAll_ACC) {
      instructionQuery.or(\orCriteria -> {
        orCriteria.compare(Instruction_ACC#StatsTimestamp, Equals, null)
        orCriteria.compare(Instruction_ACC#TotalWorkerCount, NotEquals, instructionQuery.getColumnRef("CompletedWorkerCount"))
      })
    } else {
      instructionQuery.compare(Instruction_ACC#StatsTimestamp, Equals, null)
    }
    var instructions = instructionQuery.select()
    var total = instructions.Count

    _log.info("Processing ${total} Instruction_ACC records ..")

    var instructionQueue = new LinkedList<Instruction_ACC>()
    instructions.each(\instruction -> instructionQueue.add(instruction))
    return instructionQueue
  }

  private function retryBlockedInstructions() {

    var unfinished = Query.make(InstructionWorker_ACC)
        .compare(InstructionWorker_ACC#InstructionExecStatus_ACC, Relop.Equals, InstructionExecStatus_ACC.TC_BLOCKED)
        .select()

    var total = unfinished.Count
    var count = 0

    _log.info("Retrying ${total} blocked instruction workers ...")

    unfinished.each(\worker -> {
      count += 1
      if (count % 100 == 0) {
        _log.info("Retrying blocked instruction ${count} of ${total}")
      }
      var wf = worker.InstructionWF
      if (wf != null) {
        WorkflowUtil.resumeWorkflow(wf)
      }
    })

    _log.info("Finished retrying ${total} blocked instruction workers.")
  }

}
