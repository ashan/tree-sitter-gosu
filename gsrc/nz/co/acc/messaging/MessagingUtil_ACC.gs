package nz.co.acc.messaging

uses gw.api.admin.MessageDestinationInfo
uses gw.api.admin.MessagingUtil
uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.lob.common.DateUtil_ACC

/**
 * Created by ManubaF on 23/01/2019.
 */
class MessagingUtil_ACC {
  static function retryAllMessagesByDestinations(destinationInfo:MessageDestinationInfo[]) : void {

    for(destination in destinationInfo) {
      var queryObj = Query.make(Message)
      //Message status: 1-Pending send; 2-Pending ack; 3-Error; 4-Retryable error
      queryObj.compare(Message#Status, Relop.Equals, 4)
          .compare(Message#DestinationID, Relop.Equals, destination.DestId)
      var messages = queryObj.select().toTypedArray()
      if (destination.Status == MessageDestinationStatus.TC_STARTED) {
        MessagingUtil.retryRetryableMessages(messages)
      }
    }
  }
}