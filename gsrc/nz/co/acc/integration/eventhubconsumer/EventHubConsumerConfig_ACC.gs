package nz.co.acc.integration.eventhubconsumer

/**
 * Created by Mike Ourednik on 27/08/20.
 */
class EventHubConsumerConfig_ACC {

  var _consumerGroupName : String as readonly ConsumerGroupName
  var _namespaceName : String as readonly NameSpaceName
  var _eventHubName : String as readonly EventHubName
  var _sasKeyName : String as readonly SasKeyName
  var _sasKey : String as readonly SasKey
  var _storageConnectionString : String as readonly StorageConnectionString
  var _storageContainerName : String as readonly StorageContainerName
  var _hostNamePrefix : String as readonly HostNamePrefix

  construct() {
  }

  public function setConsumerGroupName(s : String) : EventHubConsumerConfig_ACC {
    _consumerGroupName = s
    return this
  }

  public function setNamespaceName(s : String) : EventHubConsumerConfig_ACC {
    _namespaceName = s
    return this
  }

  public function setEventHubName(s : String) : EventHubConsumerConfig_ACC {
    _eventHubName = s
    return this
  }

  public function setSasKeyName(s : String) : EventHubConsumerConfig_ACC {
    _sasKeyName = s
    return this
  }

  public function setSasKey(s : String) : EventHubConsumerConfig_ACC {
    _sasKey = s
    return this
  }

  public function setStorageConnectionString(s : String) : EventHubConsumerConfig_ACC {
    _storageConnectionString = s
    return this
  }

  public function setStorageContainerName(s : String) : EventHubConsumerConfig_ACC {
    _storageContainerName = s
    return this
  }

  public function setHostNamePrefix(s : String) : EventHubConsumerConfig_ACC {
    _hostNamePrefix = s
    return this
  }
}