package nz.co.acc.integration.instruction.inbound

uses gw.plugin.integration.inbound.InboundIntegrationHandlerPlugin

uses nz.co.acc.integration.instruction.loader.InstructionFileLoader
uses nz.co.acc.plm.integration.instruction.data.InstructionUtil
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.nio.file.Path

/**
 * This handler listens an inbound channel to create bulk instruction...
 */
class InboundInstructionHandlerV2 implements InboundIntegrationHandlerPlugin {
  static var _log = StructuredLogger.INTEGRATION.withClass(InboundInstructionHandlerV2)

  /**
   * The given item is a CSV file, an bulk instruction will be created based on
   * the given CSV file.
   *
   * @param fileItem
   */
  override function process(fileItem : Object) {
    var filePath = fileItem as Path
    var file = filePath.toFile()
    _log.info("Processing file ${file.getCanonicalPath()}")

    var instructionType = InstructionUtil.deriveInstructionType(file.Name)
    var instructionFileLoader = new InstructionFileLoader(file, instructionType)
    var instructionFile = instructionFileLoader.importFromCSV()
    if (instructionFile.Status == InstructionFileStatus_ACC.TC_FAILED) {
      throw new RuntimeException("Failed to load file: ${instructionFile.ErrorMessage}")
    }
    _log.info("Finished processing file ${file.getCanonicalPath()}")
  }

}