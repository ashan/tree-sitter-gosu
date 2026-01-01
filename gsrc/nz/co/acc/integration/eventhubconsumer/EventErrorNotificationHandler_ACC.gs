package nz.co.acc.integration.eventhubconsumer

uses java.util.function.Consumer;

uses com.microsoft.azure.eventprocessorhost.ExceptionReceivedEventArgs;
uses gw.surepath.suite.integration.logging.StructuredLogger


class EventErrorNotificationHandler_ACC implements Consumer<ExceptionReceivedEventArgs> {
  private static var _log = StructuredLogger.CONFIG.withClass(EventErrorNotificationHandler_ACC)

  override function accept(t : ExceptionReceivedEventArgs) {
    _log.error_ACC("Host ${t.Hostname} received general error notification during ${t.Action}", t.Exception)
  }
}