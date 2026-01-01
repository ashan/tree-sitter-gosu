package nz.co.acc.integration.mbiefeed

uses nz.co.acc.integration.eventhubconsumer.EventHubConsumerConfig_ACC
uses nz.co.acc.integration.eventhubconsumer.EventHubConsumer_ACC
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

class MBIEEventHubConsumerFactory {

  public function create() : EventHubConsumer_ACC {

    var namespaceName = ConfigurationProperty.NZBN_EVENTHUB_NAMESPACENAME.PropertyValue
    var eventHubName = ConfigurationProperty.NZBN_EVENTHUB_EVENTHUBNAME.PropertyValue
    var sasKeyName = ConfigurationProperty.NZBN_EVENTHUB_SAS_KEYNAME.PropertyValue
    var sasKey = ConfigurationProperty.NZBN_EVENTHUB_SAS_KEY.PropertyValue
    var storageConnectionString = ConfigurationProperty.NZBN_EVENTHUB_STORAGE_CONNECTIONSTRING.PropertyValue
    var storageContainerName = ConfigurationProperty.NZBN_EVENTHUB_STORAGE_CONTAINERNAME.PropertyValue
    var consumerGroupName = ConfigurationProperty.NZBN_EVENTHUB_CONSUMERGROUP.PropertyValue
    var checkpointInterval = ConfigurationProperty.NZBN_EVENTHUB_CHECKPOINT_INTERVAL.PropertyValue.toInt()
    var hostNamePrefix = "gwpc"

    var config = new EventHubConsumerConfig_ACC()
        .setConsumerGroupName(consumerGroupName)
        .setNamespaceName(namespaceName)
        .setEventHubName(eventHubName)
        .setSasKeyName(sasKeyName)
        .setSasKey(sasKey)
        .setStorageConnectionString(storageConnectionString)
        .setStorageContainerName(storageContainerName)
        .setHostNamePrefix(hostNamePrefix)

    var eventProcessorFactory = new MBIEEventProcessorFactory(checkpointInterval)

    return new EventHubConsumer_ACC(eventProcessorFactory, config)
  }

}