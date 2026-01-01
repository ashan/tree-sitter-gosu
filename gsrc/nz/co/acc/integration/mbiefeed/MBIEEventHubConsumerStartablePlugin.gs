package nz.co.acc.integration.mbiefeed

uses gw.api.server.Availability
uses gw.api.server.AvailabilityLevel
uses gw.api.startable.IStartablePlugin
uses gw.api.startable.StartablePluginCallbackHandler
uses gw.api.startable.StartablePluginState

uses nz.co.acc.integration.eventhubconsumer.EventHubConsumer_ACC
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Startable plugin for NZBN feed
 */
@Availability(AvailabilityLevel.DAEMONS)
class MBIEEventHubConsumerStartablePlugin implements IStartablePlugin {

  var _state : StartablePluginState
  private static var _log = StructuredLogger.INTEGRATION.withClass(MBIEEventHubConsumerStartablePlugin)
  var _nzbnEventHubProcessor : EventHubConsumer_ACC

  construct() {
  }

  override function start(startablePluginCallbackHandler : StartablePluginCallbackHandler, b : boolean) {
    _log.info("Initializing NZBN EventHubProcessor")
    if (ConfigurationProperty.NZBN_EVENTHUB_ENABLED.PropertyValue.toBoolean()) {
      _nzbnEventHubProcessor = new MBIEEventHubConsumerFactory().create()
      _state = Started
    } else {
      _log.info("NZBN EventHub StartablePlugin is disabled in configuration")
      _state = Stopped
    }
  }

  override function stop(b : boolean) {
    if (_nzbnEventHubProcessor != null) {
      _log.info("Stopping NZBN EventHubProcessor")
      _nzbnEventHubProcessor.stop()
      _state = Stopped
    }
  }

  override property get State() : StartablePluginState {
    return _state
  }

}
