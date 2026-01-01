package nz.co.acc.common.integration.files.inbound

uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Created by fabianr on 22/11/2016.
 */
abstract class LineMessageTransformer {
  protected var _msg: String as Msg
  protected var _bundle : Bundle
  protected var _fileInboundMessage : FileInboundMessage_ACC

  private static var _log  = StructuredLogger.INTEGRATION.withClass(LineMessageTransformer)

  construct(msg: String) {
    this._msg = msg
  }

  construct(fileInboundMessage : FileInboundMessage_ACC){
    this._fileInboundMessage = fileInboundMessage
    this._msg = fileInboundMessage.Message
  }

  abstract function parse()

  abstract function transform() : KeyableBean

  /**
   * Local helper method to log errors.
   *
   * @param errMsg
   * @param funcName
   * @param t
   */
  protected function logError(errMsg: String, funcName: String, e: Exception) {
    _log.error_ACC(errMsg, e)
  }

}