package nz.co.acc.common.integration.files.outbound.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.files.outbound.PartialToFullCapturableData
uses nz.co.acc.common.integration.files.outbound.errorhandling.ErrorHandlingHelper
uses nz.co.acc.plm.integration.files.outbound.RecordCaptureActionFactory


/**
 * This is a custom work queue for processing OutboundRecord_ACC that have only partial data.
 * <p>
 * Work Queues are Guidewire asynchronous work item pattern, please read GW reference documentation for more informatin.
 * To use this class, each GW implementation must a BatchProcessType for the WorkQueue.
 * To configure the work queue, see work-queue.xml as specified by GW specification.
 * </p>
 * Created by Nick on 9/01/2017.
 */
class PartialOutboundRecordWorkQueue extends WorkQueueBase<OutBoundRecord_ACC, StandardWorkItem> {
  private static var _log = StructuredLogger.INTEGRATION.withClass(PartialOutboundRecordWorkQueue)

  construct(batchProcessType : BatchProcessType) {
    super(batchProcessType, StandardWorkItem, OutBoundRecord_ACC)
  }

  /**
   * Find the OutBoundRecords with partial data.
   * <p>
   * This method must limit the list size to MAX_RESULTS, however the Partial Work Queue will execute constantly
   * through out the day, so therefore unlikely ever to hit the limit and cause memory issue.
   *
   * @return
   */
  override function findTargets() : Iterator<OutBoundRecord_ACC> {
    var funcName = "findTargets"

    var targetsQuery = Query.make(OutBoundRecord_ACC)
    targetsQuery.compare(OutBoundRecord_ACC#Status, Relop.Equals, OutBoundRecordStatus_ACC.TC_PARTIAL_DATA)

    var dataInProgressList = new ArrayList<OutBoundRecord_ACC>()
    // Flag the targets so that they do not get picked up again.
    for (outboundRecord in targetsQuery.select()index i) {
      try {
        // Use commit-size block one instead of a single commit for all records which might cause some performance issues.
        gw.transaction.Transaction.runWithNewBundle(\newBundle -> {
          outboundRecord = newBundle.add(outboundRecord)
          outboundRecord.Status = OutBoundRecordStatus_ACC.TC_PARTIAL_DATA_IN_PROGRESS
        })
        dataInProgressList.add(outboundRecord)
      } catch (e : Exception) {
        logError(funcName, "Could not update the Outbound Record to status PartialDataInProgress for ID=${outboundRecord.ID}. It will be retried next time PartialData WorkQueue runs ${funcName}.", e)
      }
    }
    logInfo(funcName, "PartialData WorkQueue updated, ${dataInProgressList.size()} Outbound Records to PartialDataInProgress for WorkQueue process.")
    return dataInProgressList.iterator()
  }

  /**
   * Process this work item to populate full data to the outbound record.
   *
   * @param workItem
   */
  override function processWorkItem(workItem : StandardWorkItem) {
    var outboundRecord = extractTarget(workItem)
    gw.transaction.Transaction.runWithNewBundle(\newBundle -> {
      var captureDataAction = RecordCaptureActionFactory.getRecordCaptureAction(outboundRecord.Type, newBundle)
      if (captureDataAction != null and (captureDataAction typeis PartialToFullCapturableData)) {
        outboundRecord = captureDataAction.capturePartialToFullData(outboundRecord)
        newBundle.add(outboundRecord)
      } else {
        // Error, no PartialToFullCapturableData action.
        var msg = "The WorkItem for Outbound Record with ID" + outboundRecord.ID + " has failed."
        var errorMessage = msg + " No PartialToFullCapturableData action has been defined for this record type ${outboundRecord.Type}"
        logError("processWorkItem()", errorMessage)

        var editableOutboundRecord = newBundle.add(outboundRecord)
        editableOutboundRecord.setAsFail(errorMessage)
        ErrorHandlingHelper.createRecordFailedActivity(newBundle, outboundRecord, msg)
      }
    })
  }

  override function workItemFailed(workItem : StandardWorkItem) {
    var outboundRecord = extractTarget(workItem)
    gw.transaction.Transaction.runWithNewBundle(\newBundle -> {
      var editableOutboundRecord = newBundle.add(outboundRecord)
      editableOutboundRecord.setAsFail(workItem.Exception)
      final var msg = "The WorkItem for Outbound Record with ID" + outboundRecord.ID + " has failed with exception: ${workItem.Exception}"
      logError("workItemFailed()", msg)
      ErrorHandlingHelper.createRecordFailedActivity(newBundle, outboundRecord, msg)
    })
  }

  private function logError(fn : String, msg : String) {
    _log.error_ACC(msg)
  }

  private function logError(fn : String, msg : String, e : Exception) {
    _log.error_ACC(msg, e)
  }

  private function logInfo(fn : String, msg : String) {
    _log.info(msg)
  }
}
