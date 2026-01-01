package nz.co.acc.plm.integration.instruction.inbound

uses java.nio.file.Path
uses gw.plugin.integration.inbound.InboundIntegrationHandlerPlugin
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.instruction.data.InstructionUtil
uses nz.co.acc.common.util.CompressionUtil

/**
 * This handler listens an inbound channel to create bulk instruction...
 */
class InboundInstructionHandler implements InboundIntegrationHandlerPlugin {

  /**
   * The given item is a CSV file, an bulk instruction will be created based on
   *   the given CSV file.
   * @param fileItem
   */
  override function process(fileItem: Object) {
    var filePath = fileItem as Path
    var file = filePath.toFile()
    StructuredLogger.INTEGRATION_FILE.info(this.getClass().getCanonicalName() + "file : " + file.getCanonicalPath() + " Process STARTED!")

    if(ScriptParameters.CheckInstructionSchedule_ACC) {
      if(InstructionUtil.deriveInstructionType(file.Name) != null) {
        gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
          var bulkUploadFile = new BulkUploadFile_ACC()
          bulkUploadFile.ERFileBlob = new Blob(CompressionUtil.convertFileContentToBlob(file))
          bulkUploadFile.Filename = file.Name
        })
      }
    } else {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        var instruction = new Instruction_ACC()
        instruction.IsSynchronous = false
        instruction.InstructionType_ACC = InstructionUtil.deriveInstructionType(file.Name)
        instruction.WorkerBuilder.importFromCSV(file, bundle)
        instruction.Parameters = file.Name
        instruction.buildWorker()
      })
    }

    StructuredLogger.INTEGRATION_FILE.info(this.getClass().getCanonicalName() + " Process ENDED!")
  }
}