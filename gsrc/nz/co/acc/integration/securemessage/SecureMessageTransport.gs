package nz.co.acc.integration.securemessage

uses gw.plugin.messaging.MessageTransport
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

class SecureMessageTransport implements MessageTransport {
  final var LOG = StructuredLogger_ACC.CONFIG.withClass(this)
  public final static var DEST_ID : int = 11
  final var _api = new SecureMessageServiceAPIClient()

  override function send(message : Message, transformedPayload : String) {
    if (not ConfigurationProperty.SECUREMESSAGING_SERVICE_ENABLED.PropertyValue.toBoolean()) {
      LOG.info("Secure messaging disabled. Not sending message ID=${message.ID}")
      return
    }
    var secureMessage = message.MessageRoot as SecureMessage_ACC
    try {
      _api.send(secureMessage)
      message.reportAck()
    } catch (e : Exception) {
      message.reportError()
      throw e
    }
  }

  override function shutdown() {
  }

  override function suspend() {
  }

  override function resume() {
  }

  override property set DestinationID(destinationID : int) {
  }

}