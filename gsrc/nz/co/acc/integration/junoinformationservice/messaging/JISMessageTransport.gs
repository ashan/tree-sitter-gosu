package nz.co.acc.integration.junoinformationservice.messaging

uses gw.plugin.messaging.MessageTransport

uses nz.co.acc.integration.junoinformationservice.client.JunoInfoServiceClient
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Created by Mike Ourednik on 21/09/2019.
 */
class JISMessageTransport implements MessageTransport {
  public static final var DEST_ID : Integer = 10

  static private var _log = StructuredLogger.INTEGRATION.withClass(JISMessageTransport)

  override function send(message : Message, s : String) {
    try {
      switch (message.EventName) {
        case JISMessageEvents.EVENT_ACCOUNT_CHANGE:
        case JISMessageEvents.EVENT_ACCOUNT_CHANGE_LATEST_POLICY:
        case JISMessageEvents.EVENT_ACCOUNT_CHANGE_RENEWAL:
          handleAccountMessage(message)
          break

        case JISMessageEvents.EVENT_POLICY_CHANGE:
        case JISMessageEvents.EVENT_POLICY_CHANGE_RENEWAL:
          handlePolicyPeriodMessage(message)
          break

        case JISMessageEvents.EVENT_DOCUMENT_ADDED:
        case JISMessageEvents.EVENT_DOCUMENT_CHANGED:
          JunoInfoServiceClient.INSTANCE.update(
              message.MessageRoot as Document,
              ScriptParameters.JunoInformationServiceNotificationsEnabled_ACC)
          message.reportAck()
          break

        case JISMessageEvents.EVENT_DOCUMENT_REMOVED:
          JunoInfoServiceClient.INSTANCE.delete(message.MessageRoot as Document)
          message.reportAck()
          break

        default:
          throw new RuntimeException("Unhandled event ${message.EventName}")
      }
    } catch (e : Exception) {
      _log.error_ACC("Error occurred while processing message", e)
      message.ErrorDescription = e.StackTraceAsString?.truncate(250)
      message.reportError()
    }
  }

  private function handleAccountMessage(message : Message) {
    var notificationsEnabled = ScriptParameters.JunoInformationServiceNotificationsEnabled_ACC

    if (message.EventName == JISMessageEvents.EVENT_ACCOUNT_CHANGE_RENEWAL) {
      notificationsEnabled = ScriptParameters.JunoInformationServiceNotificationsEnabled_ACC
          and ScriptParameters.JunoInformationServiceRenewalsNotificationsEnabled_ACC
    } else if (message.EventName == JISMessageEvents.EVENT_ACCOUNT_CHANGE_LATEST_POLICY) {
      notificationsEnabled = false
    }

    JunoInfoServiceClient.INSTANCE.update(message.Account, notificationsEnabled)
    message.reportAck()
  }

  private function handlePolicyPeriodMessage(message : Message) {
    var period = message.PolicyPeriod

    if (period.Status == PolicyPeriodStatus.TC_BOUND and not period.MostRecentModel) {
      _log.info("SKIPPING MESSAGE ${period.JunoInfoServiceDisplayName_ACC} - MostRecentModel=false")
      message.remove()

    } else {
      var notificationsEnabled = ScriptParameters.JunoInformationServiceNotificationsEnabled_ACC
      if (message.EventName == JISMessageEvents.EVENT_POLICY_CHANGE_RENEWAL) {
        notificationsEnabled = notificationsEnabled and ScriptParameters.JunoInformationServiceRenewalsNotificationsEnabled_ACC
      }
      JunoInfoServiceClient.INSTANCE.update(period, notificationsEnabled)
      message.reportAck()
    }
  }

  override function shutdown() {
    // not used
    _log.info(JISMessageTransport.Type.RelativeName + " shutdown")
  }

  override function suspend() {
    // not used
    _log.info(JISMessageTransport.Type.RelativeName + " suspended")
  }

  override function resume() {
    // not used
    _log.info(JISMessageTransport.Type.RelativeName + " resumed")
  }

  override property set DestinationID(destinationID : int) {
    // not used
  }
}