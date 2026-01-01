package nz.co.acc.integration.util

uses gw.surepath.suite.integration.logging.StructuredLogger_ACC

uses java.nio.file.Path

class InboundIntegrationHelper {
  static final var LOG = StructuredLogger_ACC.INTEGRATION.withClass(InboundIntegrationHelper)

  /**
   * Starts work queue writer ONLY if there are no other files pending
   */
  static function startWorkQueueIfAllFilesProcessed(
      currentFile: Path,
      inboundDir: String,
      workQueueType: BatchProcessType) {
    var inboundFileUtil = new InboundFileUtil(inboundDir)
    var batchUtil = new WorkQueueUtil(workQueueType)

    LOG.info("Checking remaining inbound files to determine if ${workQueueType} work queue should be started")
    LOG.info("Current file: ${currentFile}")
    LOG.info("Incoming files: ${inboundFileUtil.listIncomingFiles()}")
    LOG.info("Processing files: ${inboundFileUtil.listProcessingFiles()}")

    var activeWorkItems = batchUtil.getNumActiveWorkItems()
    if (activeWorkItems > 0) {
      LOG.info("Work queue already has active work items. Not re-starting work queue.")
      // TODO: this requires intervention to re-start the work queue to process new items
      return
    }

    if (not inboundFileUtil.listIncomingFiles().Empty) {
      LOG.info("Additional files are pending in 'incoming' folder. Not starting work queue")
      return
    }

    var processingFiles = inboundFileUtil.listProcessingFiles()

    if (processingFiles.Count == 0) {
      // This could only happen in a Gunit test scenario
      LOG.info("No files exist in 'processing' folder. Not starting work queue")

    } else if (processingFiles.Count == 1 and processingFiles.contains(currentFile.FileName.toString())) {
      LOG.info("No additional files are pending in 'processing' folder. Starting work queue")
      batchUtil.startWorkQueue()

    } else {
      LOG.info("Additional files are pending in 'processing' folder. Not starting work queue")
    }
  }
}