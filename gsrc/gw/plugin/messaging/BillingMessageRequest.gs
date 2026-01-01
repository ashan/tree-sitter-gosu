package gw.plugin.messaging
uses gw.api.system.database.SequenceUtil
uses java.util.Date
uses gw.api.util.BatchSequenceUtil
uses gw.surepath.suite.integration.logging.StructuredLogger

@Export
class BillingMessageRequest implements MessageRequest{

  private var logger = StructuredLogger.MESSAGING.withClass(BillingMessageRequest)

  construct() {  }
  
  override function beforeSend(message : Message) : String {
    return message.Payload
  }

  override function shutdown() {
    logger.info(BillingMessageRequest.Type.RelativeName + " shutdown")
  }

  override function resume() {
    logger.info(BillingMessageRequest.Type.RelativeName + " resumed")
  }

  override function suspend() {
    logger.info(BillingMessageRequest.Type.RelativeName + " suspended")
  }

  override property set DestinationID(p0 : int) { }


  override function afterSend(p0 : Message) { }

}
