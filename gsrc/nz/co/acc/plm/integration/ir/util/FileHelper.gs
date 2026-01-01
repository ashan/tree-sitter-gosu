package nz.co.acc.plm.integration.ir.util

uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File
uses java.lang.invoke.MethodHandles

/**
 * Util class to handle small files
 */
class FileHelper {
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  /**
   * Write string to given file, this can't be used to handle big file.
   */
  public function writeContentToFile(filePath : String, content : String) {
    var fn = "writeContentToFile"
    _logger.debug(this + " " + fn + " " + "Start")
    try {
      _logger.debug(this + " " + fn + " " + "AbsoluteFilePath [${filePath}]")
      var file = new File(filePath)
      content.writeTo(file)
    } catch(e : Exception) {
      _logger.error_ACC("Failed to Import File...Error:" , e)
    }
    _logger.debug(this + " " + fn + " " + "END")
  }

  /**
   * Read from given file, this can't be used to handle big file.
   */
  public function retrieveFileContentAsString(filePath : String) :  String {
    var fn = "retrieveFileContentAsString"
    _logger.debug(this + " " + fn + " " + "Start")

    var fileContentString : String = null
    try {
      _logger.debug(this + " " + fn + " " + "AbsoluteFilePath [${filePath}]")
      fileContentString = new File(filePath).read()
    } catch(e : Exception) {
      _logger.error_ACC("Failed to Import File...Error:" , e)
    }
    _logger.debug(this + " " + fn + " " + "END")
    return fileContentString
  }

}