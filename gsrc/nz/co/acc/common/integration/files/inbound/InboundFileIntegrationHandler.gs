package nz.co.acc.common.integration.files.inbound

uses gw.pl.logging.LoggerCategory
uses gw.plugin.integration.inbound.InboundIntegrationHandlerPlugin
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.files.inbound.utils.InboundFileValidationResponse

/**
 * Created by fabianr on 17/11/2016.
 */
class InboundFileIntegrationHandler implements InboundIntegrationHandlerPlugin {
  private static var _logger = StructuredLogger.INTEGRATION_FILE.withClass(InboundFileIntegrationHandler)

  construct() {
    _logger.info("STARTUP")
  }

  override function process(o : Object) {
    _logger.info("Process STARTED")
    var file = o as java.nio.file.Path
    try {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        var fileMessageHandler = new FileMessageHandler(file)
        if (fileMessageHandler.hasValidationErrors().size() == 0) {
          var inbndFileMsg = fileMessageHandler.createInbndFileMsg(InbndFileMsgStatus_ACC.TC_DONE, InboundFileValidationResponse.VALID)
          if (inbndFileMsg != null) {
            bundle.add(inbndFileMsg)
            var fileMessageProcessor = new FileMessageProcessor(bundle, inbndFileMsg, fileMessageHandler.isDocumentControlFile(), file)
            fileMessageProcessor.run()
          } else {
            gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\errbundle -> {
              errbundle.add(fileMessageHandler.createInbndFileMsgForDuplicateFiles(InbndFileMsgStatus_ACC.TC_ERROR, InboundFileValidationResponse.DUPLICATE_FILE))
            })
            _logger.info("Duplicate Incoming File Error =>" + InboundFileValidationResponse.DUPLICATE_FILE)
            throw new Exception("Duplicate Incoming File Errors")
          }
        } else {
          gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\errbundle -> {
            errbundle.add(fileMessageHandler.createInbndFileMsg(InbndFileMsgStatus_ACC.TC_ERROR, fileMessageHandler.hasValidationErrors().toString()))
          })
          _logger.info("File Validation Errors =>" + fileMessageHandler.hasValidationErrors().toString())
          throw new Exception("File Validation Errors")
        }
      })
    } catch (e : Exception) {
      _logger.error_ACC("Process :" + e.getMessage())
      throw e
    }
    _logger.info("Process FINISHED")
  }


}
