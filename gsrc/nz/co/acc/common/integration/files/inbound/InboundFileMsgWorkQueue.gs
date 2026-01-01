package nz.co.acc.common.integration.files.inbound

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.processes.WorkQueueBase
uses nz.co.acc.plm.integration.files.inbound.transformer.FileTransformer

/**
 * Work Queue, it reads the FileInboundMessage_ACC entity, check if there is a new entry and process one
 * Each InbndFileMsgType must have entry to the typelist
 */
class InboundFileMsgWorkQueue extends WorkQueueBase<FileInboundMessage_ACC, InbndFileMsgWorkItem_ACC> {


  construct() {
    super(BatchProcessType.TC_INBOUNDFILEMSGWORKQUEUE, InbndFileMsgWorkItem_ACC, FileInboundMessage_ACC);
  }

  override function processWorkItem(inbndFileMsgWorkItem_acc: InbndFileMsgWorkItem_ACC) {
    var fileTransformer = new FileTransformer()
    fileTransformer.processWorkItem(inbndFileMsgWorkItem_acc)
  }

  override function findTargets(): Iterator<FileInboundMessage_ACC> {
    var targetQuery = Query.make(FileInboundMessage_ACC)
    targetQuery.compare(FileInboundMessage_ACC#Status, Relop.Equals, FileInboundMsgStatus_ACC.TC_NEW).compare(FileInboundMessage_ACC#Processed, Relop.Equals, 0)
    return targetQuery.select().iterator()
  }

  override function createWorkItem(fileInboundMessage: FileInboundMessage_ACC, safeBundle: Bundle): InbndFileMsgWorkItem_ACC {
    var customWorkItem = new InbndFileMsgWorkItem_ACC(safeBundle)
    customWorkItem.FileInboundMessage_ACC = fileInboundMessage
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      fileInboundMessage.Processed = 1
    })
    return customWorkItem
  }
}