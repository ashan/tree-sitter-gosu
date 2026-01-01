package nz.co.acc.common

uses gw.plugin.workqueue.IBatchCompletedNotification
uses nz.co.acc.common.integration.files.inbound.InboundFileMsgWorkQueueCompletedNotification

/**
 * Created by fabianr on 4/07/2017.
 */
class BatchCompletedNotification_ACC implements IBatchCompletedNotification {

  override function completed(processHistory: ProcessHistory, i: int) {
    if (processHistory.ProcessType == BatchProcessType.TC_INBOUNDFILEMSGWORKQUEUE) {
      new InboundFileMsgWorkQueueCompletedNotification().doProcess()
    }
  }

}