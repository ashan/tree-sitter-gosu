package nz.co.acc.common.integration.files.inbound

uses nz.co.acc.plm.integration.files.inbound.InboundPostWorkQueueProcess

/**
 * Created by fabianr on 4/07/2017.
 */
class InboundFileMsgWorkQueueCompletedNotification {

  public function doProcess() {
    new InboundPostWorkQueueProcess().doWork()
  }


}