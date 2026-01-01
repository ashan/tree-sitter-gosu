package nz.co.acc.common.integration.apimgmt.transport

uses gw.plugin.messaging.MessageTransport
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.apimgmt.json.JSONInternalEnvelope
uses nz.co.acc.common.integration.apimgmt.json.JSONSerializer
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses org.apache.http.client.utils.URIBuilder

/**
 * Messaging transport plugin for the API Management integration. Uses the {@linkplain APIMgmtClient} to send the http requests out.
 */
class APIMgmtMessageTransport implements MessageTransport {

  private static var _log = StructuredLogger.INTEGRATION.withClass(APIMgmtMessageTransport)
  override function send(message: Message, s: String) {
    var fn = "send"

    try {
      var serializer = new JSONSerializer<JSONInternalEnvelope>()
      var envelope = serializer.fromJSON(s)
      var endpointUri = new URIBuilder("${ConfigurationProperty.API_MGMT_URL_BASE.PropertyValue}${envelope.Endpoint}").build()

      if (message.Account == null) {
        _log.warn_ACC( "Non-safe-ordered message detected for api management. MessagePayload=${envelope.Payload}")
      }

      APIMgmtClient.Instance.send(endpointUri, envelope.Payload, envelope.Operation.Code)
      message.reportAck()

    } catch (e: Exception) {
      _log.error_ACC("Exception occured while sending data to api management. See cause below.", e)
      message.ErrorDescription = e.Message
      message.reportError()
      throw e
    }
  }

  override function shutdown() {
    _log.info(APIMgmtMessageTransport.Type.RelativeName + " shutdown")

  }

  override function suspend() {
    _log.info(APIMgmtMessageTransport.Type.RelativeName + " suspended")
  }

  override function resume() {
    _log.info(APIMgmtMessageTransport.Type.RelativeName + " resumed")
  }

  override property set DestinationID(destinationID : int) {

  }
}