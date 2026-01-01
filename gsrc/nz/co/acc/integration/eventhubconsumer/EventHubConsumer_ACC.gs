package nz.co.acc.integration.eventhubconsumer

uses com.microsoft.azure.eventhubs.ConnectionStringBuilder
uses com.microsoft.azure.eventprocessorhost.EventProcessorHost
uses com.microsoft.azure.eventprocessorhost.EventProcessorOptions
uses com.microsoft.azure.eventprocessorhost.IEventProcessorFactory
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Generic EventHub consumer
 */
class EventHubConsumer_ACC {

  private static var _log = StructuredLogger.INTEGRATION.withClass(EventHubConsumer_ACC)

  var _eventProcessorHost : EventProcessorHost

  public construct(eventProcessorFactory : IEventProcessorFactory, config : EventHubConsumerConfig_ACC) {

    _log.info("Registering EventProcessor on EventHub ${config.EventHubName}");

    var eventHubConnectionString = new ConnectionStringBuilder()
        .setNamespaceName(config.NameSpaceName)
        .setEventHubName(config.EventHubName)
        .setSasKeyName(config.SasKeyName)
        .setSasKey(config.SasKey)
        .toString()

    _eventProcessorHost = EventProcessorHost.EventProcessorHostBuilder
        .newBuilder(EventProcessorHost.createHostName(config.HostNamePrefix), config.ConsumerGroupName)
        .useAzureStorageCheckpointLeaseManager(config.StorageConnectionString, config.StorageContainerName, null)
        .useEventHubConnectionString(eventHubConnectionString, config.EventHubName)
        .build()

    var options = new EventProcessorOptions();
    options.setExceptionNotification(new EventErrorNotificationHandler_ACC());

    _eventProcessorHost.registerEventProcessorFactory(eventProcessorFactory, options)

    _log.info("Finished registering EventProcessor on EventHub ${config.EventHubName}");
  }

  public function stop() {
    _log.info("Unregistering EventProcessor ... (this can take a minute)")
    _eventProcessorHost.unregisterEventProcessor().get()
    _log.info("EventProcessor stopped")
  }
}