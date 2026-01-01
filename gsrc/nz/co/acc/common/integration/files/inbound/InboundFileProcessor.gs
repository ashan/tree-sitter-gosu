package nz.co.acc.common.integration.files.inbound


uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.nio.file.Files
uses java.nio.file.Path
uses java.util.stream.Stream

/**
 * Created by Geoff Infield on 20/02/2017.
 * <p>
 * Extend this class to create a processor for files that are to be processed IMMEDIATELY
 * after validation instead of being split into message on a queue.
 * Requires returning true from FileMessageProcessor.processImmediately() which causes
 * FileMessageProcessor.process() to be called, constructing a class extending this one.
 */
abstract class InboundFileProcessor {
  protected var _msg : InbndFileMsg_ACC
  protected var _fileInboundMessage : FileInboundMessage_ACC
  private static var _log = StructuredLogger.INTEGRATION_FILE.withClass(FileMessageProcessor)

  protected var _filePath : Path
  protected var _stream : Stream<String>
  protected var _linesArray : List<Object>
  protected var _errors : List<String> as Errors

  construct(inbndFileMsg : InbndFileMsg_ACC, filePath : Path) {
    this._msg = inbndFileMsg
    this._filePath = filePath
    this._stream = Files.lines(this._filePath)
    this._linesArray = this._stream.toArray().fastList()
    this._errors = new ArrayList<String>()
  }

  abstract function process() : Integer

  /**
   * Log an error message
   *
   * @param msg
   */
  protected function logError(msg : String) {
    _log.error_ACC(msg)
  }

  /**
   * Log an info message
   *
   * @param msg
   */
  protected function logInfo(msg : String) {
    _log.info(msg)
  }

}