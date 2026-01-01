package nz.co.acc.plm.integration.files.inbound.transformer

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Created by Nithy on 6/04/2017.
 */
class FileTransformer {
  function processWorkItem(inbndFileMsgWorkItem_acc: InbndFileMsgWorkItem_ACC) {
    StructuredLogger.INTEGRATION_FILE.debug("[InboundFileIntegration] ->> processing an item in workqueue")
    var fileInboundMessage = inbndFileMsgWorkItem_acc.FileInboundMessage_ACC
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      try {
        switch (fileInboundMessage.InbndFileMsg.InbndFileMsgType) {
          case InbndFileMsgType_ACC.TC_GNA:
            new GNAUpdateTransformer(bundle, fileInboundMessage)
            break
          case InbndFileMsgType_ACC.TC_ACC_LEVYINVOICE:
            new MailhouseLevyInvoiceTransformer(bundle, fileInboundMessage)
            break
          case InbndFileMsgType_ACC.TC_ACC_LETTERS:
            new MailhouseLettersTransformer(bundle, fileInboundMessage)
            break
          case InbndFileMsgType_ACC.TC_DELETE_DOCUMENTS:
            new DeleteDocumentsTransformer(bundle, fileInboundMessage)
            break
        }
        fileInboundMessage.Status = FileInboundMsgStatus_ACC.TC_DONE
      } catch (e: Exception) {
        StructuredLogger.INTEGRATION_FILE.error_ACC("[InboundFileIntegration] ->> processing an item in workqueue " , e)
        fileInboundMessage.Status = FileInboundMsgStatus_ACC.TC_ERROR
        fileInboundMessage.Remark = "Error processing the file :" + e.Message
        //var anErrorNotification = new InboundActivityUtil()
        //anErrorNotification.createInboundRecordFaildActivity(fileInboundMessage.PublicID, e.Message, fileInboundMessage.getInbndFileMsg().getFileName(), fileInboundMessage.Status)
      } finally {
        fileInboundMessage.ProcessedDateTime = Date.Now
        bundle.add(fileInboundMessage)
      }
    })
  }
}