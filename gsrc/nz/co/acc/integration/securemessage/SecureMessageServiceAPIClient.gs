package nz.co.acc.integration.securemessage

uses gw.api.json.JsonObject
uses gw.logging.TraceabilityIDConstants
uses gw.restclient.config.Config
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gwgen.securemessageservice.api.SecureMessageServiceApi
uses gwgen.securemessageservice.model.MessageDetails
uses gwgen.securemessageservice.model.ReplyTo
uses gwgen.securemessageservice.model.SecureMessageModel
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses org.slf4j.MDC

class SecureMessageServiceAPIClient {
  final var LOG = StructuredLogger.INTEGRATION.withClass(this)
  var _api: SecureMessageServiceApi

  public construct() {
    if (ConfigurationProperty.SECUREMESSAGING_SERVICE_ENABLED.PropertyValue.toBoolean()) {
      _api = Config.builder()
          .basePath(ConfigurationProperty.SECUREMESSAGING_SERVICE_APIM_BASEPATH.PropertyValue)
          .logLevel(Config.LogLevel.FULL)
          .build()
          .buildAPI(SecureMessageServiceApi)
    } else {
      LOG.info("Secure messaging disabled")
    }
  }

  function send(message : SecureMessage_ACC) {
    final var headerSourceApplication = SecureMessageSource_ACC.TC_GUIDEWIRE.Code
    final var headerApimForwardHost = ConfigurationProperty.SECUREMESSAGING_SERVICE_APIM_FORWARD_HOST.PropertyValue
    final var headerApimSubscriptionKey = ConfigurationProperty.SECUREMESSAGING_SERVICE_APIM_SUBSCRIPTION_KEY.PropertyValue
    final var headerOrgId = "ACC"

    var replyTo = new ReplyTo()
    replyTo.setReplyMessageId(message.ReplyToMessageID)

    var bcssMessage = new JsonObject()
    bcssMessage.put("accNumber", message.Account.ACCID_ACC)
    bcssMessage.put("subject", message.SecureMessageThread_ACC.Subject)
    bcssMessage.put("senderName", message.SenderName)
    bcssMessage.put("message", message.Payload)

    var messageDetails = new MessageDetails()
    messageDetails.setTemplate(message.Template.getIntegrationTemplateName())
    messageDetails.setDocuments({})
    messageDetails.setData(bcssMessage)

    var model = new SecureMessageModel()
    model.setCreatedDate(message.MessageTime.toISOTimestamp())
    model.setReplyTo(replyTo)
    model.setMessageId(message.MessageID)
    model.setSource(headerSourceApplication)
    model.setMessageDetails(messageDetails)
    model.setCustomProperties(new JsonObject())
    model.setDiagnostic(new JsonObject())

    var xCorrelationID = getTraceabilityID()

    LOG.info("Sending message " + message.MessageID)

    _api.submitSecureMessageRequestUsingPOST(
        xCorrelationID,
        headerSourceApplication,
        headerOrgId,
        headerApimSubscriptionKey,
        headerApimForwardHost,
        model)
  }

  private function getTraceabilityID() : String {
    return MDC.get(TraceabilityIDConstants.TRACEABILITY_ID_KEY)
  }

}